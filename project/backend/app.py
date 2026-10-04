"""
AI Assignment Research Agent - Flask REST API Backend
Provides endpoints for health verification, topic research synthesis,
and full academic paper generation using the Google Gemini API.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from services.research_agent import ResearchAgent

app = Flask(__name__)
# Enable CORS for frontend cross-origin requests
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize the research agent
agent = None
try:
    agent = ResearchAgent()
except Exception as e:
    print(f"[WARNING] ResearchAgent initialization deferred: {e}")

def get_agent():
    """Lazy initialize agent if environment was loaded or key was updated."""
    global agent
    if agent is None:
        agent = ResearchAgent()
    return agent


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint.
    Used by frontend to test connectivity and readiness.
    """
    api_key_configured = bool(
        os.getenv("GEMINI_API_KEY")
        and os.getenv("GEMINI_API_KEY") != "your_actual_gemini_api_key_here"
    )

    return jsonify({
        "status": "Backend is running",
        "service": "AI Assignment Research Agent API",
        "api_key_configured": api_key_configured,
        "engine": "Google Gemini 3.8 Flash"
    }), 200


@app.route("/api/research", methods=["POST"])
def conduct_research_endpoint():
    """
    POST /api/research
    Accepts topic, subject, research question, source count, and citation style.
    Returns synthesized research summary, key findings, sources, and questions.
    """
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    subject = data.get("subject", "").strip()
    question = data.get("question", "").strip()
    sources = data.get("sources", 5)
    citation_style = data.get("citation_style", "APA 7th")

    # Input Validation
    if not topic:
        return jsonify({
            "success": False,
            "error": "The research topic field cannot be empty. Please provide an assignment topic."
        }), 400

    try:
        current_agent = get_agent()
        results = current_agent.conduct_research(
            topic=topic,
            subject=subject,
            question=question,
            source_count=sources,
            citation_style=citation_style
        )
        return jsonify(results), 200

    except ValueError as ve:
        return jsonify({
            "success": False,
            "error": str(ve)
        }), 400
    except Exception as e:
        app.logger.error(f"Error in /api/research: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to synthesize research: {str(e)}"
        }), 500


@app.route("/api/generate-report", methods=["POST"])
def generate_report_endpoint():
    """
    POST /api/generate-report
    Accepts topic, subject, question, and optional existing sources.
    Returns complete structured research report (Abstract, Introduction,
    Literature Review, Methodology, Results/Findings, Discussion, Conclusion, References).
    """
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    subject = data.get("subject", "").strip()
    question = data.get("question", "").strip()
    citation_style = data.get("citation_style", "APA 7th")
    sources = data.get("sources", [])

    if not topic:
        return jsonify({
            "success": False,
            "error": "The research topic field is required to generate an academic report."
        }), 400

    try:
        current_agent = get_agent()
        report_data = current_agent.generate_report(
            topic=topic,
            subject=subject,
            question=question,
            citation_style=citation_style,
            sources=sources
        )
        return jsonify(report_data), 200

    except ValueError as ve:
        return jsonify({
            "success": False,
            "error": str(ve)
        }), 400
    except Exception as e:
        app.logger.error(f"Error in /api/generate-report: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to generate structured report: {str(e)}"
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_ENV") == "development"
    print(f"🚀 AI Assignment Research Agent backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
