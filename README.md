# AI Assignment Research Agent

A polished, full-stack AI-powered student research platform built with React + FastAPI.

## Features

- 🔬 **5-Stage Research Pipeline** — Planner → Research → Analysis → Writer → Citation agents
- 📚 **Real Scholarly Sources** — Live queries to OpenAlex & Crossref (250M+ verified papers)
- 🤖 **Gemini AI Synthesis** — Academic synthesis, key findings, and structured report drafting
- 📝 **8-Section Academic Report** — Abstract, Introduction, Literature Review, Methodology, Findings, Discussion, Limitations, Conclusion
- 📤 **Multi-format Export** — PDF, DOCX, TXT, and Markdown downloads
- 🔐 **Secure Auth** — HttpOnly cookie sessions with per-student data isolation
- 🌙 **Light / Dark Theme** — System-aware with manual toggle
- 📱 **Responsive Design** — Mobile-friendly sidebar with glassmorphism aesthetics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + SQLAlchemy + SQLite |
| AI | Google Gemini (gemini-2.5-flash) |
| Scholarly | OpenAlex API + Crossref API |
| Auth | HttpOnly cookie sessions |
| Styling | Vanilla CSS with CSS variables |

## Quick Start

### 1. Backend Setup

```bash
cd "ai-assignment-research-agent 1"
pip install -r requirements.txt

# Create backend/.env
echo "GEMINI_API_KEY=your_gemini_api_key_here" > backend/.env

# Start backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key
DATABASE_URL=sqlite:///./research_agent.db   # optional, defaults to SQLite
```

Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/).

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── models.py                # SQLAlchemy database models
│   ├── auth.py                  # Session management
│   ├── database.py              # DB setup
│   ├── routers/
│   │   ├── auth_routes.py       # Register / Login / Logout
│   │   ├── research_routes.py   # Research, Reports, Export
│   │   ├── profile_routes.py    # Student profile management
│   │   └── upload_routes.py     # Assignment brief upload
│   └── services/
│       ├── gemini_service.py    # Gemini AI synthesis & reports
│       └── scholarly.py         # OpenAlex & Crossref integration
├── src/
│   ├── App.tsx                  # Main React application
│   └── index.css                # Design system & styles
├── public/
├── package.json
└── vite.config.ts
```

## License

MIT
