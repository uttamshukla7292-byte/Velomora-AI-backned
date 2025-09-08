const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Initialize Firebase Admin (Fields from separate env variables) ---
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.FIREBASE_TYPE,
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            clientId: process.env.FIREBASE_CLIENT_ID,
            authUri: process.env.FIREBASE_AUTH_URI,
            tokenUri: process.env.FIREBASE_TOKEN_URI,
            authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
            universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN
        })
    });
}

// Middleware to verify Firebase ID Token
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; 
        next();
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
}

// Chat endpoint (Protected)
app.post('/api/chat', verifyFirebaseToken, async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) return res.status(400).json({ error: 'Message is required' });

        // Gemini API call
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: userMessage }] }] }
        );

        const aiResponse =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No reply from AI";

        res.json({ response: aiResponse });
    } catch (error) {
        console.error("Error calling Gemini API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get response from AI" });
    }
});

// Token verification endpoint
app.post('/api/verify-token', async (req, res) => {
    const idToken = req.body.token;
    if (!idToken) return res.status(400).json({ error: "Token required" });

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        res.json({ valid: true, user: decodedToken });
    } catch (error) {
        res.status(401).json({ valid: false, error: error.message });
    }
});

app.listen(port, () => console.log(`✅ Backend running on port ${port}`));
