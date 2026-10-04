# 🎓 AI Assignment Research Agent

An AI-powered academic research assistant that analyzes assignment topics, synthesizes empirical findings, organizes scholarly sources with citations, and generates structured academic reports suitable for college projects and presentations.

---

## 📁 Project Directory Structure

```text
project/
│
├── frontend/
│   ├── index.html        # Modern, responsive academic UI
│   ├── style.css         # Academic & AI theme, cards, print-ready PDF styling
│   └── script.js         # Async fetch API client with configurable API_BASE_URL
│
├── backend/
│   ├── app.py            # Flask REST API server (CORS enabled)
│   ├── requirements.txt  # Python package requirements
│   ├── .env              # Local environment configuration
│   └── services/
│       └── research_agent.py  # Core Gemini 3.8 Flash research agent
│
└── README.md             # Complete step-by-step instructions
```

---

## 🚀 Quick Start Guide

### Step 1: Install Python Dependencies
Open your terminal and navigate to the backend directory:
```bash
cd project/backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Install required packages
pip install -r requirements.txt
```

### Step 2: Create the `.env` File
In `project/backend/`, create or edit the `.env` file:
```bash
# In project/backend/.env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
FLASK_ENV=development
```

### Step 3: Add Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create or copy your Gemini API key.
3. Paste it as the value for `GEMINI_API_KEY` in `project/backend/.env`.
4. *Important: Never commit `.env` to Git. The `.gitignore` file is already set up to protect it.*

### Step 4: Start the Flask Backend
Run the Flask server:
```bash
python app.py
```
You should see:
```text
🚀 AI Assignment Research Agent backend running on http://127.0.0.1:5000
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

### Step 5: Start / Open the Frontend
You can run the frontend in any of the following simple ways:
1. **Direct browser opening:** Double-click `project/frontend/index.html` or drag it into any web browser (Chrome, Edge, Firefox, Safari).
2. **VS Code Live Server:** Right-click `project/frontend/index.html` and choose **"Open with Live Server"**.
3. **Python HTTP Server:**
   ```bash
   cd project/frontend
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your browser.

### Step 6: Test the API

#### Test 1: Health Check (GET)
```bash
curl http://127.0.0.1:5000/api/health
```
**Expected Response:**
```json
{
  "status": "Backend is running",
  "service": "AI Assignment Research Agent API",
  "api_key_configured": true,
  "engine": "Google Gemini 3.8 Flash"
}
```

#### Test 2: Synthesize Research (POST)
```bash
curl -X POST http://127.0.0.1:5000/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Quantum Computing and Public-Key Cryptography",
    "subject": "Computer Science",
    "question": "What is the timeline and impact of Shor'\''s algorithm on RSA?",
    "sources": 5,
    "citation_style": "APA 7th"
  }'
```

#### Test 3: Generate Academic Report (POST)
```bash
curl -X POST http://127.0.0.1:5000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Quantum Computing and Public-Key Cryptography",
    "subject": "Computer Science",
    "question": "What is the timeline and impact of Shor'\''s algorithm on RSA?"
  }'
```

---

## 🌐 Deployment Instructions

### Deploy the Backend (Render / Railway / Cloud Run)

#### Option A: Deploy to Render.com
1. Push your repository to GitHub.
2. In Render, click **New > Web Service**.
3. Select your repository.
4. Set:
   - **Root Directory:** `project/backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py` (or `gunicorn app:app`)
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: your secret API key
   - `PORT`: `5000` (or `10000`)
6. Deploy! Render will give you a public URL (e.g. `https://your-agent.onrender.com`).

#### Option B: Deploy to Railway.app
1. Create a new project from your GitHub repo.
2. Set root directory to `project/backend`.
3. Add `GEMINI_API_KEY` in the Variables tab.
4. Railway will deploy and generate a public domain URL.

---

## 🔗 Connect the Deployed Backend URL to the Frontend

In `project/frontend/script.js`, find line 8:
```javascript
// =========================================================================
// API CONFIGURATION: Change this URL if your backend runs on a different port or host
// =========================================================================
const API_BASE_URL = "http://localhost:5000";
// =========================================================================
```
Change it to your deployed backend URL:
```javascript
const API_BASE_URL = "https://your-agent.onrender.com";
```
Save the file. Your frontend is now connected to your live cloud backend!

---

## 🧠 AI Agent Workflow & Architecture

```text
User Enters Research Topic & Scope
                 ↓
Frontend sends JSON POST to /api/research
                 ↓
Backend Flask API validates inputs
                 ↓
AI Research Agent (Gemini 3.8 Flash) executes multi-step analysis:
  ├─ 1. Analyze topic & academic discipline
  ├─ 2. Formulate core sub-inquiries & hypotheses
  ├─ 3. Synthesize empirical findings & theoretical principles
  ├─ 4. Curate peer-reviewed scholarly sources with formal citations
  └─ 5. Propose future high-impact research questions
                 ↓
Frontend renders interactive findings cards & sources list
                 ↓
User clicks "Generate Full Report"
                 ↓
Backend drafts complete 8-part academic paper:
  1. Abstract
  2. Introduction & Problem Statement
  3. Thematic Literature Review
  4. Methodology & Analytical Framework
  5. Empirical Results & Findings
  6. Academic Discussion & Limitations
  7. Conclusion & Future Outlook
  8. References (APA 7th, MLA 9th, IEEE, etc.)
                 ↓
Frontend provides One-Click Markdown Export and Print-to-PDF formatting
```

---

## 🛡️ Security Best Practices
- **API Key Isolation:** The `GEMINI_API_KEY` is loaded exclusively on the backend server from environment variables.
- **Frontend Protection:** Zero API keys or secrets are stored in HTML or JavaScript.
- **CORS Restricted:** Backend includes explicit CORS headers for secure browser communication.
- **Input Sanitization:** All user inputs are validated before sending to the Gemini model.
