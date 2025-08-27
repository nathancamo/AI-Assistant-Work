require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic in-memory knowledge base and feedback (could be replaced with DB)
let knowledgeBaseContent = '';
let feedbackStore = [];

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(limiter);

// Gemini proxy endpoint (supports knowledge base injection)
app.post('/api/gemini', async (req, res) => {
    // Expect { prompt, tone, type, useKnowledgeBase }
    const { prompt, tone, type, useKnowledgeBase } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt." });

    let kb = '';
    if (useKnowledgeBase && knowledgeBaseContent) {
        kb = `\n\nHere is additional reference knowledge for context:\n${knowledgeBaseContent}\n\n`;
    }

    let inputPrompt = prompt;
    if (type === 'generator') {
        inputPrompt = `Student query: ${prompt}\nReply in a ${tone === 'auto' ? 'appropriate' : tone} tone.${kb}`;
    } else if (type === 'snapshot') {
        inputPrompt = `Provide a proactive summary of potential issues for course code: ${prompt}${kb}`;
    } else if (type === 'prereq') {
        inputPrompt = `Given these completed units: ${prompt}, what are the next eligible units or steps?${kb}`;
    } else if (type === 'case') {
        inputPrompt = `Summarize this case concisely:\n${prompt}${kb}`;
    } else if (type === 'scenario') {
        inputPrompt = `Given this hypothetical scenario, provide a recovery plan:\n${prompt}${kb}`;
    } else if (type === 'career') {
        inputPrompt = `For this course: ${prompt}, list relevant career pathways and options.${kb}`;
    } else if (type === 'analytics') {
        inputPrompt = `${prompt}${kb}`;
    } else {
        inputPrompt = prompt + kb;
    }

    try {
        const apiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: inputPrompt }] }]
                })
            }
        );
        const data = await apiRes.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || "Gemini API Error" });
    }
});

// Knowledge Base APIs
app.get('/api/knowledge-base', (req, res) => {
    res.json({ content: knowledgeBaseContent });
});
app.post('/api/knowledge-base', (req, res) => {
    knowledgeBaseContent = req.body.content || '';
    res.json({ success: true });
});

// Feedback APIs
app.post('/api/feedback', (req, res) => {
    const feedback = {
        text: req.body.text,
        source: req.body.source,
        timestamp: Date.now()
    };
    feedbackStore.push(feedback);
    res.json({ success: true });
});
app.get('/api/feedback', (req, res) => {
    res.json({ feedback: feedbackStore });
});

app.get('/', (_, res) => res.send('AI-Assistant-Work backend is running.'));

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
