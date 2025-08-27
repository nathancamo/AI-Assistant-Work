# AI-Assistant-Work

A web-based AI assistant tool for student queries, analytics, and workflow support.  
Now features **secure Gemini API integration**, advanced features, and improved emoji icon support!

---
## Features

- **Smart Response Generator:** Paste or OCR student queries, get Gemini-powered answers.
- **Assistant Tools:** Case summaries, scenario planning, career mapping, chain checker, and more, all AI powered.
- **Conversation History:** Browse previous queries and AI responses.
- **Downloadable responses:** Save generated responses as .txt files.
- **Feedback tracking:** User feedback saved and used for analytics.
- **Live Knowledge Base:** Edit course info; can be injected into AI answers for extra accuracy.
- **Analytics:** Predictive insights, weekly reports, feedback analysis.
- **Dark mode:** User switch between light/dark UI.
- **Responsive/mobile design.**
- **Backend proxy:** API key never exposed to users.
- **Emoji/Material icons:** Maximum compatibility.

---

## Getting Started (Local)

### 1. Clone and Install

```bash
git clone https://github.com/nathancamo/AI-Assistant-Work.git
cd AI-Assistant-Work
npm install
```

### 2. Add Your Gemini API Key

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Backend

```bash
node server.js
```

Backend runs at [http://localhost:3001](http://localhost:3001)

### 4. Open the Frontend

Open `index.html` in your browser.

---

## Deploying

- **Backend:** Host on Vercel, Render, Heroku, etc.
- **Frontend:** Host on GitHub Pages, Netlify, etc.  
- Update API endpoint as needed.

---

## License

MIT License

---
