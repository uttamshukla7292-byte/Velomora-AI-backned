const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint for handling chat requests
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Force Gemini to reply in markdown format
        const prompt = `
Reply strictly in **Markdown format**:
- Use headings (#, ##, ###)
- Use numbered lists for steps
- Use bullet points for options
- Use **bold text** for highlighting

Now answer this: ${userMessage}
        `;

        // Call the Google Gemini API (using gemini-2.0-flash model)
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        // Extract AI response safely
        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from AI";

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
