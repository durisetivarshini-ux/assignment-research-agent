"""
AI Assignment Research Agent - FastAPI Production Backend.
Integrates SQLAlchemy, SQLite/PostgreSQL, OpenAlex/Crossref scholarly indexes,
Google Gemini 3.8 Flash, secure HttpOnly cookie authentication, and ownership security.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

from backend.database import init_db
from backend.routers import auth_routes, profile_routes, research_routes, upload_routes
from backend.services.gemini_service import is_gemini_key_valid


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    print("[AI Research Agent] Database initialized successfully.")
    yield


app = FastAPI(
    title="AI Assignment Research Agent API",
    description="Backend API powering scholarly literature search, AI synthesis, and academic report generation.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_routes.router)
app.include_router(profile_routes.router)
app.include_router(research_routes.router)
app.include_router(upload_routes.router)


@app.get("/api/health")
def health_check():
    """
    Health check endpoint returning system readiness, database status,
    and Gemini AI integration status.
    """
    gemini_ready = is_gemini_key_valid()
    return {
        "status": "online",
        "service": "AI Assignment Research Agent API",
        "version": "2.0.0",
        "engine": "FastAPI + SQLAlchemy + SQLite",
        "scholarly_source_index": "OpenAlex & Crossref Verified APIs",
        "gemini_configured": gemini_ready,
        "ai_model": "gemini-3.8-flash" if gemini_ready else "Configuration Required (GEMINI_API_KEY)"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
