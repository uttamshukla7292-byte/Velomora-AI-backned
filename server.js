const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Call Gemini API (latest model: gemini-2.0-flash)
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [{ text: userMessage }]
                    }
                ]
            }
        );

        console.log("Gemini Raw Response:", JSON.stringify(response.data, null, 2));

        // Extract AI response safely
        const aiResponse =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No reply from AI";

        res.json({ response: aiResponse });
    } catch (error) {
        console.error("Error calling Gemini API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get response from AI" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Velomora backend running on port ${port}`);
});
