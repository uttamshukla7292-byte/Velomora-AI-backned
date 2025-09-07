const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Firebase setup
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');

const firebaseConfig = {
    apiKey: "AIzaSyB1v5B2odGoRYeUJ56NKYJAyk4X1O3czjo",
    authDomain: "velomora-ai.firebaseapp.com",
    projectId: "velomora-ai",
    storageBucket: "velomora-ai.appspot.com",
    messagingSenderId: "555320665031",
    appId: "1:555320665031:web:729487bd26132bc5e62fe2",
    measurementId: "G-QF8V1ZE9QJ"
};

const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

const app = express();
const port = 3000; // direct port

app.use(cors());
app.use(express.json());

// Firebase Auth Endpoints
app.post('/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        res.json({ message: "Signup successful", email: userCredential.user.email });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        res.json({ message: "Login successful", email: userCredential.user.email });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/auth/logout', async (req, res) => {
    try {
        await signOut(auth);
        res.json({ message: "Logout successful" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Gemini API Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?keAIzaSyDaWMbiYsVDdGmZGKjyGdLKda1hsz9wSCk`,
            {
                contents: [
                    { parts: [{ text: userMessage }] }
                ]
            }
        );

        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from AI";

        res.json({ response: aiResponse });
    } catch (error) {
        console.error("Error calling Gemini API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get response from AI" });
    }
});

app.listen(port, () => console.log(`✅ Velomora backend running on port ${port}`));
