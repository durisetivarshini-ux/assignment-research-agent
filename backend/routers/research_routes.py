"""
Research and Report routes for AI Assignment Research Agent.
Connects genuine scholarly APIs (OpenAlex / Crossref) and Google Gemini 3.8 Flash.
Enforces strict record ownership across all requests, reports, and history items.
Includes export endpoints (PDF, DOCX, TXT) and research question management.
"""

import io
import re
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, ResearchRequest, ResearchReport, UploadedFile
from backend.auth import get_current_user
from backend.services.scholarly import ScholarlyResearchService
from backend.services.gemini_service import (
    GeminiResearchSynthesizer,
    is_gemini_key_valid
)

router = APIRouter(prefix="/api", tags=["Research & Reports"])
scholarly_service = ScholarlyResearchService()


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class ConductResearchRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500)
    subject: Optional[str] = "General Academic Discipline"
    assignment_type: Optional[str] = "Research Paper"
    word_target: Optional[int] = 2000
    citation_style: Optional[str] = "APA"
    guidelines: Optional[str] = None
    source_count: Optional[int] = 5
    file_id: Optional[str] = None


class GenerateReportRequest(BaseModel):
    request_id: Optional[str] = None
    topic: str = Field(..., min_length=3)
    subject: Optional[str] = "General Academic Discipline"
    assignment_type: Optional[str] = "Research Paper"
    citation_style: Optional[str] = "APA"
    word_target: Optional[int] = 2000
    guidelines: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    include_student_details: Optional[bool] = False


class UpdateReportRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=500)
    report_content: Optional[Dict[str, Any]] = None


class UpdateQuestionsRequest(BaseModel):
    questions: List[str] = Field(..., min_items=1, max_items=10)


class RegenerateQuestionsRequest(BaseModel):
    request_id: str


class UpdateReportSectionRequest(BaseModel):
    section: str
    content: str


# ---------------------------------------------------------------------------
# Config / Status
# ---------------------------------------------------------------------------

@router.get("/config-status")
def get_service_status():
    """Returns whether Gemini AI engine and scholarly indexes are active."""
    return {
        "scholarly_index_status": "Active (OpenAlex + Crossref verified scholarly repositories)",
        "gemini_configured": is_gemini_key_valid(),
        "model": "gemini-2.5-flash",
        "supported_citation_styles": ["APA", "IEEE", "MLA", "Harvard"]
    }


# ---------------------------------------------------------------------------
# Research Execution
# ---------------------------------------------------------------------------

@router.post("/research")
def conduct_research(
    payload: ConductResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Conduct multi-step scholarly research on the assignment topic.
    1. Queries verified academic repositories for real papers, DOIs, and authors.
    2. Incorporates assignment brief / syllabus guidelines.
    3. Runs Gemini synthesis if configured, or returns real verified sources.
    4. Persists the research record under the authenticated student's account.
    """
    clean_topic = payload.topic.strip()
    if not clean_topic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The assignment research topic cannot be empty."
        )

    # Verify file ownership if file_id is provided
    brief_text = None
    if payload.file_id:
        file_rec = db.query(UploadedFile).filter(
            UploadedFile.id == payload.file_id,
            UploadedFile.user_id == current_user.id
        ).first()
        if not file_rec:
            payload.file_id = None
        elif file_rec.extracted_text:
            brief_text = file_rec.extracted_text[:2000]

    # Step 1: Retrieve genuine peer-reviewed scholarly sources
    sources = scholarly_service.search_scholarly_sources(
        topic=clean_topic,
        subject=payload.subject,
        source_count=payload.source_count or 5,
        citation_style=payload.citation_style or "APA"
    )

    # Step 2: AI synthesis
    synthesizer = GeminiResearchSynthesizer()
    synthesis_result: Dict[str, Any] = {}
    gemini_active = synthesizer.is_configured

    if gemini_active:
        try:
            guidelines_combined = payload.guidelines or ""
            if brief_text:
                guidelines_combined = f"{guidelines_combined}\n\nAssignment Brief Content:\n{brief_text}".strip()

            synthesis_result = synthesizer.synthesize_research(
                topic=clean_topic,
                subject=payload.subject or "General Academic Discipline",
                assignment_type=payload.assignment_type or "Research Paper",
                citation_style=payload.citation_style or "APA",
                guidelines=guidelines_combined or None,
                verified_sources=sources
            )
        except Exception as e:
            print(f"[Gemini Synthesis Fallback] {e}")
            gemini_active = False

    if not gemini_active:
        summary = (
            f"Scholarly literature search conducted for '{clean_topic}' across peer-reviewed repositories. "
            f"Found {len(sources)} indexed academic works with verified DOIs and author citations. "
            "Google Gemini AI synthesis is required to generate automated thematic synthesis and literature reviews."
        )
        key_findings = [
            {
                "title": f"Empirical Evidence from {s.get('publication_or_source', 'Scholarly Journal')}",
                "description": s.get("abstract", f"Peer-reviewed research study investigating {s.get('title')}."),
                "evidence_type": "Verified Peer-Reviewed Abstract",
                "impact_level": "High",
                "academic_importance": f"Source verified in {s.get('publication_or_source', 'scholarly publication')}.",
                "limitations": "Full text access may be required for detailed evidence.",
                "source_indices": [i+1]
            }
            for i, s in enumerate(sources[:3])
        ]
        research_questions = [
            f"What methodological criteria distinguish empirical findings in contemporary studies on {clean_topic}?",
            f"How do foundational theoretical frameworks align with recent experimental observations in {payload.subject}?",
            f"What practical constraints arise when applying these research principles to university-level case analyses?",
            f"What ethical or governance considerations are associated with {clean_topic}?",
            f"What future research directions would most advance understanding of {clean_topic}?"
        ]
        synthesis_result = {
            "summary": summary,
            "key_findings": key_findings,
            "research_questions": research_questions,
            "methodology_recommendations": f"Literature synthesis adhering to {payload.assignment_type} academic protocols."
        }

    # Step 3: Persist research request
    req_record = ResearchRequest(
        user_id=current_user.id,
        topic=clean_topic,
        subject=payload.subject or "General Academic Discipline",
        assignment_type=payload.assignment_type or "Research Paper",
        word_target=payload.word_target or 2000,
        citation_style=payload.citation_style or "APA",
        guidelines=payload.guidelines,
        status="completed",
        summary=synthesis_result.get("summary"),
        key_findings=synthesis_result.get("key_findings", []),
        sources=sources,
        research_questions=synthesis_result.get("research_questions", []),
        file_id=payload.file_id
    )
    db.add(req_record)
    db.commit()
    db.refresh(req_record)

    return {
        "success": True,
        "request_id": req_record.id,
        "gemini_configured": synthesizer.is_configured,
        "configuration_requirement": None if synthesizer.is_configured else "Add GEMINI_API_KEY to enable Google Gemini AI synthesis.",
        "topic": clean_topic,
        "subject": payload.subject,
        "assignment_type": payload.assignment_type,
        "citation_style": payload.citation_style,
        "word_target": payload.word_target,
        "summary": synthesis_result.get("summary"),
        "key_findings": synthesis_result.get("key_findings", []),
        "sources": sources,
        "research_questions": synthesis_result.get("research_questions", []),
        "methodology_recommendations": synthesis_result.get("methodology_recommendations"),
        "created_at": req_record.created_at.isoformat()
    }


# ---------------------------------------------------------------------------
# Research Questions Management
# ---------------------------------------------------------------------------

@router.get("/research/{request_id}")
def get_research_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific research request with full details."""
    req = db.query(ResearchRequest).filter(
        ResearchRequest.id == request_id,
        ResearchRequest.user_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Research request not found or unauthorized.")
    return {
        "id": req.id,
        "topic": req.topic,
        "subject": req.subject,
        "assignment_type": req.assignment_type,
        "word_target": req.word_target,
        "citation_style": req.citation_style,
        "guidelines": req.guidelines,
        "status": req.status,
        "summary": req.summary,
        "key_findings": req.key_findings or [],
        "sources": req.sources or [],
        "research_questions": req.research_questions or [],
        "created_at": req.created_at.isoformat()
    }


@router.put("/research/{request_id}/questions")
def update_research_questions(
    request_id: str,
    payload: UpdateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update research questions for a specific research request."""
    req = db.query(ResearchRequest).filter(
        ResearchRequest.id == request_id,
        ResearchRequest.user_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Research request not found or unauthorized.")

    clean_questions = [q.strip() for q in payload.questions if q.strip()]
    req.research_questions = clean_questions
    db.commit()
    db.refresh(req)

    return {
        "success": True,
        "message": "Research questions updated successfully.",
        "questions": req.research_questions
    }


@router.post("/research/{request_id}/regenerate-questions")
def regenerate_research_questions(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate research questions using Gemini."""
    req = db.query(ResearchRequest).filter(
        ResearchRequest.id == request_id,
        ResearchRequest.user_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Research request not found or unauthorized.")

    synthesizer = GeminiResearchSynthesizer()
    if not synthesizer.is_configured:
        raise HTTPException(
            status_code=400,
            detail="Gemini API key is required to regenerate questions."
        )

    try:
        new_questions = synthesizer.regenerate_questions(
            topic=req.topic,
            subject=req.subject,
            assignment_type=req.assignment_type,
            guidelines=req.guidelines,
            verified_sources=req.sources or []
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate questions: {str(e)}")

    req.research_questions = new_questions
    db.commit()

    return {
        "success": True,
        "message": "Research questions regenerated.",
        "questions": new_questions
    }


# ---------------------------------------------------------------------------
# Report Generation & Management
# ---------------------------------------------------------------------------

@router.post("/generate-report")
def generate_report(
    payload: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate and save a publication-grade 8-section academic report.
    Enforces student record ownership and grounds citations in verified sources.
    """
    clean_topic = payload.topic.strip()
    sources = payload.sources or []
    research_questions = None

    if payload.request_id:
        req_rec = db.query(ResearchRequest).filter(
            ResearchRequest.id == payload.request_id,
            ResearchRequest.user_id == current_user.id
        ).first()
        if req_rec:
            clean_topic = req_rec.topic
            payload.subject = req_rec.subject
            payload.assignment_type = req_rec.assignment_type
            payload.citation_style = req_rec.citation_style
            payload.word_target = req_rec.word_target
            payload.guidelines = req_rec.guidelines
            if not sources:
                sources = req_rec.sources or []
            research_questions = req_rec.research_questions

    if not sources:
        sources = scholarly_service.search_scholarly_sources(
            topic=clean_topic,
            subject=payload.subject,
            source_count=5,
            citation_style=payload.citation_style or "APA"
        )

    synthesizer = GeminiResearchSynthesizer()
    if not synthesizer.is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Gemini API key is required to synthesize and draft academic reports. "
                   "Please configure GEMINI_API_KEY in backend/.env or your environment variables."
        )

    # Get student name if requested
    student_name = None
    if payload.include_student_details:
        if current_user.profile:
            student_name = current_user.profile.full_name

    try:
        report_data = synthesizer.generate_full_report(
            topic=clean_topic,
            subject=payload.subject or "General Academic Discipline",
            assignment_type=payload.assignment_type or "Research Paper",
            citation_style=payload.citation_style or "APA",
            word_target=payload.word_target or 2000,
            guidelines=payload.guidelines,
            verified_sources=sources,
            research_questions=research_questions,
            student_name=student_name
        )
    except Exception as e:
        print(f"[Gemini Report Synthesis Fallback due to: {e}]")
        report_data = synthesizer.generate_fallback_report(
            topic=clean_topic,
            subject=payload.subject or "General Academic Discipline",
            assignment_type=payload.assignment_type or "Research Paper",
            citation_style=payload.citation_style or "APA",
            word_target=payload.word_target or 2000,
            guidelines=payload.guidelines,
            verified_sources=sources,
            research_questions=research_questions,
            student_name=student_name
        )

    report_record = ResearchReport(
        user_id=current_user.id,
        request_id=payload.request_id,
        title=report_data.get("title", f"Academic Research Report: {clean_topic}"),
        topic=clean_topic,
        subject=payload.subject or "General Academic Discipline",
        assignment_type=payload.assignment_type or "Research Paper",
        citation_style=payload.citation_style or "APA",
        word_count_estimate=report_data.get("word_count_actual", payload.word_target or 2000),
        abstract=report_data.get("abstract", ""),
        report_content={
            **report_data,
            "sources": sources,
            "research_questions": research_questions or [],
            "word_target": payload.word_target or 2000,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return {
        "success": True,
        "message": "Academic report generated and saved successfully.",
        "report_id": report_record.id,
        "title": report_record.title,
        "topic": report_record.topic,
        "subject": report_record.subject,
        "assignment_type": report_record.assignment_type,
        "citation_style": report_record.citation_style,
        "word_count_estimate": report_record.word_count_estimate,
        "abstract": report_record.abstract,
        "report_content": report_record.report_content,
        "created_at": report_record.created_at.isoformat()
    }


@router.get("/reports")
def list_student_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all reports owned by the authenticated student."""
    reports = db.query(ResearchReport).filter(
        ResearchReport.user_id == current_user.id
    ).order_by(ResearchReport.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "topic": r.topic,
            "subject": r.subject,
            "assignment_type": r.assignment_type,
            "citation_style": r.citation_style,
            "word_count_estimate": r.word_count_estimate,
            "abstract": r.abstract,
            "report_content": r.report_content,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat()
        }
        for r in reports
    ]


@router.get("/reports/{report_id}")
def get_student_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve single report. Enforces record ownership."""
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or you do not have permission to view it."
        )

    return {
        "id": report.id,
        "title": report.title,
        "topic": report.topic,
        "subject": report.subject,
        "assignment_type": report.assignment_type,
        "citation_style": report.citation_style,
        "word_count_estimate": report.word_count_estimate,
        "abstract": report.abstract,
        "report_content": report.report_content,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat()
    }


@router.put("/reports/{report_id}")
def update_report(
    report_id: str,
    payload: UpdateReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update report title or content sections. Enforces record ownership."""
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or unauthorized."
        )

    if payload.title:
        report.title = payload.title.strip()

    if payload.report_content:
        # Merge updated sections into existing content
        existing = dict(report.report_content or {})
        existing.update(payload.report_content)
        existing["last_edited"] = datetime.now(timezone.utc).isoformat()
        report.report_content = existing

        # Recalculate word count
        text_sections = ["abstract", "introduction", "literature_review", "methodology",
                        "findings", "discussion", "limitations", "conclusion"]
        total_words = sum(
            len(str(existing.get(s, "")).split())
            for s in text_sections
        )
        report.word_count_estimate = total_words

    db.commit()
    db.refresh(report)

    return {
        "success": True,
        "message": "Report updated successfully.",
        "id": report.id,
        "title": report.title,
        "word_count_estimate": report.word_count_estimate,
        "report_content": report.report_content
    }


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete report. Enforces record ownership."""
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or unauthorized."
        )

    db.delete(report)
    db.commit()

    return {"success": True, "message": "Report removed successfully."}


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

@router.get("/history")
def list_research_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List research requests conducted by the authenticated student."""
    requests = db.query(ResearchRequest).filter(
        ResearchRequest.user_id == current_user.id
    ).order_by(ResearchRequest.created_at.desc()).all()

    return [
        {
            "id": req.id,
            "topic": req.topic,
            "subject": req.subject,
            "assignment_type": req.assignment_type,
            "citation_style": req.citation_style,
            "word_target": req.word_target,
            "status": req.status,
            "summary": req.summary,
            "key_findings": req.key_findings,
            "sources": req.sources,
            "research_questions": req.research_questions,
            "created_at": req.created_at.isoformat()
        }
        for req in requests
    ]


@router.delete("/history/{request_id}")
def delete_history_item(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a research request item. Enforces record ownership."""
    req_item = db.query(ResearchRequest).filter(
        ResearchRequest.id == request_id,
        ResearchRequest.user_id == current_user.id
    ).first()

    if not req_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research history entry not found or unauthorized."
        )

    db.delete(req_item)
    db.commit()

    return {"success": True, "message": "Research history entry removed."}


# ---------------------------------------------------------------------------
# Export Endpoints
# ---------------------------------------------------------------------------

def _sanitize_filename(text: str) -> str:
    """Sanitize text for use in filenames."""
    clean = re.sub(r'[^\w\s-]', '', text)
    clean = re.sub(r'[\s_]+', '_', clean.strip())
    return clean[:60]


def _build_txt_content(report: ResearchReport, scope: str, include_student: bool = False) -> str:
    """Build plain-text export content."""
    rc = report.report_content or {}
    lines = []

    # Header
    lines.append("=" * 70)
    lines.append(report.title.upper())
    lines.append("=" * 70)
    lines.append(f"Subject: {report.subject}")
    lines.append(f"Assignment Type: {report.assignment_type}")
    lines.append(f"Citation Style: {report.citation_style}")
    lines.append(f"Target Word Count: {rc.get('word_target', report.word_count_estimate)}")
    lines.append(f"Actual Word Count: {report.word_count_estimate}")
    lines.append(f"Generated: {report.created_at.strftime('%B %d, %Y')}")
    if rc.get("last_edited"):
        lines.append(f"Last Edited: {rc['last_edited'][:10]}")
    lines.append("")

    # Research Questions (complete package only)
    if scope == "complete":
        questions = rc.get("research_questions", [])
        if questions:
            lines.append("-" * 70)
            lines.append("RESEARCH QUESTIONS")
            lines.append("-" * 70)
            for i, q in enumerate(questions, 1):
                lines.append(f"{i}. {q}")
            lines.append("")

        # Sources
        sources = rc.get("sources", [])
        if sources:
            lines.append("-" * 70)
            lines.append("ACADEMIC SOURCES")
            lines.append("-" * 70)
            for i, s in enumerate(sources, 1):
                lines.append(f"{i}. {s.get('title', 'Unknown Title')}")
                lines.append(f"   Authors: {s.get('authors', 'Unknown')}")
                lines.append(f"   Year: {s.get('year', 'n.d.')}")
                lines.append(f"   Venue: {s.get('publication_or_source', '')}")
                if s.get('doi') or s.get('url'):
                    lines.append(f"   URL/DOI: {s.get('doi') or s.get('url')}")
                lines.append("")

        # Key Findings
        findings = rc.get("key_findings", [])
        if findings:
            lines.append("-" * 70)
            lines.append("KEY FINDINGS")
            lines.append("-" * 70)
            for i, f in enumerate(findings, 1):
                lines.append(f"{i}. {f.get('title', '')}")
                lines.append(f"   Evidence: {f.get('description', '')}")
                if f.get('academic_importance'):
                    lines.append(f"   Importance: {f.get('academic_importance')}")
                if f.get('limitations'):
                    lines.append(f"   Limitations: {f.get('limitations')}")
                lines.append("")

    # Report Sections
    sections = [
        ("1. Abstract & Executive Summary", "abstract"),
        ("2. Introduction & Problem Formulation", "introduction"),
        ("3. Theoretical Framework & Literature Foundations", "literature_review"),
        ("4. Methodology & Analytical Pipeline", "methodology"),
        ("5. Empirical Findings & Key Insights", "findings"),
        ("6. Discussion & Practical Implications", "discussion"),
        ("7. Limitations & Ethical Governance", "limitations"),
        ("8. Conclusion & Future Recommendations", "conclusion"),
    ]
    for heading, key in sections:
        content = rc.get(key, "")
        if content:
            lines.append("-" * 70)
            lines.append(heading)
            lines.append("-" * 70)
            lines.append(content)
            lines.append("")

    # References
    references = rc.get("references", [])
    if references:
        lines.append("-" * 70)
        lines.append("REFERENCES")
        lines.append("-" * 70)
        for i, ref in enumerate(references, 1):
            lines.append(f"{i}. {ref}")
        lines.append("")

    lines.append("=" * 70)
    lines.append(f"Exported from AI Assignment Research Agent | {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append("=" * 70)

    return "\n".join(lines)


def _build_docx_content(report: ResearchReport, scope: str) -> io.BytesIO:
    """Build a Word document export."""
    from docx import Document
    from docx.shared import Pt, Cm, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    rc = report.report_content or {}
    doc = Document()

    # Page setup: A4
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21)
    section.left_margin = Cm(2.54)
    section.right_margin = Cm(2.54)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)

    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)

    # Add page numbers
    def add_page_number(paragraph):
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run()
        fldChar1 = OxmlElement('w:fldChar')
        fldChar1.set(qn('w:fldCharType'), 'begin')
        instrText = OxmlElement('w:instrText')
        instrText.set(qn('xml:space'), 'preserve')
        instrText.text = 'PAGE'
        fldChar2 = OxmlElement('w:fldChar')
        fldChar2.set(qn('w:fldCharType'), 'end')
        run._r.append(fldChar1)
        run._r.append(instrText)
        run._r.append(fldChar2)

    footer = section.footer
    footer_para = footer.paragraphs[0]
    add_page_number(footer_para)

    def add_heading(text, level=1):
        p = doc.add_heading(text, level=level)
        p.style.font.name = 'Times New Roman'
        for run in p.runs:
            run.font.name = 'Times New Roman'
            run.font.bold = True
        return p

    def add_body_paragraph(text, spacing_before=0, spacing_after=6):
        if not text:
            return
        p = doc.add_paragraph(text)
        p.style.font.name = 'Times New Roman'
        p.paragraph_format.space_before = Pt(spacing_before)
        p.paragraph_format.space_after = Pt(spacing_after)
        p.paragraph_format.line_spacing = Pt(18)
        for run in p.runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12)
        return p

    # Title Page
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_para.paragraph_format.space_before = Pt(72)
    title_run = title_para.add_run(report.title)
    title_run.font.name = 'Times New Roman'
    title_run.font.size = Pt(16)
    title_run.font.bold = True

    doc.add_paragraph()
    sub_para = doc.add_paragraph()
    sub_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub_para.add_run(f"{report.assignment_type} in {report.subject}")
    sub_run.font.name = 'Times New Roman'
    sub_run.font.size = Pt(13)
    sub_run.font.italic = True

    meta_para = doc.add_paragraph()
    meta_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_run = meta_para.add_run(
        f"Citation Style: {report.citation_style}  ·  "
        f"Target: {rc.get('word_target', report.word_count_estimate)} words  ·  "
        f"Actual: {report.word_count_estimate} words\n"
        f"Date: {report.created_at.strftime('%B %d, %Y')}"
    )
    meta_run.font.name = 'Times New Roman'
    meta_run.font.size = Pt(11)

    doc.add_page_break()

    # Research Questions (complete package)
    if scope == "complete":
        questions = rc.get("research_questions", [])
        if questions:
            add_heading("Research Questions", level=1)
            for i, q in enumerate(questions, 1):
                p = doc.add_paragraph(style='List Number')
                p.text = q
                for run in p.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(12)
            doc.add_paragraph()

        sources = rc.get("sources", [])
        if sources:
            add_heading("Academic Sources", level=1)
            for s in sources:
                src_para = doc.add_paragraph()
                title_run = src_para.add_run(s.get('title', 'Unknown'))
                title_run.font.bold = True
                title_run.font.name = 'Times New Roman'
                title_run.font.size = Pt(12)
                meta_run = src_para.add_run(
                    f"\n{s.get('authors', '')} ({s.get('year', 'n.d.')}) — {s.get('publication_or_source', '')}"
                )
                meta_run.font.name = 'Times New Roman'
                meta_run.font.size = Pt(11)
                meta_run.font.italic = True
                if s.get('abstract'):
                    add_body_paragraph(s['abstract'])
            doc.add_paragraph()
            doc.add_page_break()

        findings = rc.get("key_findings", [])
        if findings:
            add_heading("Key Findings", level=1)
            for f in findings:
                finding_para = doc.add_paragraph()
                f_run = finding_para.add_run(f.get('title', ''))
                f_run.font.bold = True
                f_run.font.name = 'Times New Roman'
                f_run.font.size = Pt(12)
                if f.get('description'):
                    add_body_paragraph(f['description'])
                if f.get('academic_importance'):
                    imp_para = doc.add_paragraph()
                    label_run = imp_para.add_run("Academic Importance: ")
                    label_run.font.bold = True
                    label_run.font.name = 'Times New Roman'
                    label_run.font.size = Pt(11)
                    imp_para.add_run(f.get('academic_importance', ''))
                doc.add_paragraph()
            doc.add_page_break()

    # Report Sections
    sections = [
        ("1. Abstract & Executive Summary", "abstract"),
        ("2. Introduction & Problem Formulation", "introduction"),
        ("3. Theoretical Framework & Literature Foundations", "literature_review"),
        ("4. Methodology & Analytical Pipeline", "methodology"),
        ("5. Empirical Findings & Key Insights", "findings"),
        ("6. Discussion & Practical Implications", "discussion"),
        ("7. Limitations & Ethical Governance", "limitations"),
        ("8. Conclusion & Future Recommendations", "conclusion"),
    ]
    for heading_text, key in sections:
        content = rc.get(key, "")
        if content:
            add_heading(heading_text, level=1)
            for paragraph in str(content).split('\n\n'):
                if paragraph.strip():
                    add_body_paragraph(paragraph.strip())
            doc.add_paragraph()

    # References
    references = rc.get("references", [])
    if references:
        add_heading("References", level=1)
        for ref in references:
            ref_para = doc.add_paragraph()
            ref_para.paragraph_format.left_indent = Cm(1.27)
            ref_para.paragraph_format.first_line_indent = Cm(-1.27)
            ref_run = ref_para.add_run(str(ref))
            ref_run.font.name = 'Times New Roman'
            ref_run.font.size = Pt(12)

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def _build_pdf_content(report: ResearchReport, scope: str) -> io.BytesIO:
    """Build a PDF export using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable,
        ListFlowable, ListItem
    )
    from reportlab.platypus.tableofcontents import TableOfContents

    rc = report.report_content or {}
    buf = io.BytesIO()

    PAGE_W, PAGE_H = A4
    MARGIN = 2.54 * cm
    ACCENT = HexColor("#1a56db")
    GRAY = HexColor("#4b5563")
    LIGHT_GRAY = HexColor("#f3f4f6")

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN + 0.5 * cm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=20,
        textColor=HexColor("#111827"),
        alignment=TA_CENTER,
        spaceAfter=8
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=13,
        textColor=GRAY,
        alignment=TA_CENTER,
        spaceAfter=4
    )
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=11,
        textColor=GRAY,
        alignment=TA_CENTER,
        spaceAfter=4
    )
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=14,
        textColor=ACCENT,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=12,
        textColor=HexColor("#374151"),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=12,
        leading=20,
        textColor=HexColor("#111827"),
        alignment=TA_JUSTIFY,
        spaceAfter=8
    )
    ref_style = ParagraphStyle(
        'Ref',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=11,
        leading=16,
        textColor=HexColor("#374151"),
        leftIndent=20,
        firstLineIndent=-20,
        spaceAfter=6
    )

    story = []

    def page_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Times-Roman', 10)
        canvas.setFillColor(GRAY)
        canvas.drawCentredString(PAGE_W / 2, 1.5 * cm, f"Page {doc.page}")
        canvas.restoreState()

    # Title page
    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph(report.title, title_style))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(f"{report.assignment_type} in {report.subject}", subtitle_style))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        f"Citation Style: {report.citation_style} &nbsp;·&nbsp; "
        f"Target: {rc.get('word_target', report.word_count_estimate)} words &nbsp;·&nbsp; "
        f"Actual: {report.word_count_estimate} words",
        meta_style
    ))
    story.append(Paragraph(f"Date: {report.created_at.strftime('%B %d, %Y')}", meta_style))
    story.append(PageBreak())

    def add_section(heading, content):
        if not content:
            return
        story.append(Paragraph(heading, h1_style))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
        for para in str(content).split('\n\n'):
            if para.strip():
                # Escape special XML chars
                safe = para.strip().replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(safe, body_style))
        story.append(Spacer(1, 8))

    # Research Questions (complete package)
    if scope == "complete":
        questions = rc.get("research_questions", [])
        if questions:
            story.append(Paragraph("Research Questions", h1_style))
            story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
            for i, q in enumerate(questions, 1):
                safe_q = str(q).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(f"<b>{i}.</b> {safe_q}", body_style))
            story.append(Spacer(1, 16))

        sources = rc.get("sources", [])
        if sources:
            story.append(Paragraph("Academic Sources", h1_style))
            story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
            for s in sources:
                title_text = str(s.get('title', '')).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(f"<b>{title_text}</b>", body_style))
                meta = f"{s.get('authors', '')} ({s.get('year', 'n.d.')}) — <i>{s.get('publication_or_source', '')}</i>"
                meta_safe = meta.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(meta_safe, ref_style))
                if s.get('abstract'):
                    ab = str(s['abstract']).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    story.append(Paragraph(ab, body_style))
                story.append(Spacer(1, 8))
            story.append(PageBreak())

        findings = rc.get("key_findings", [])
        if findings:
            story.append(Paragraph("Key Findings", h1_style))
            story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
            for f in findings:
                f_title = str(f.get('title', '')).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(f"<b>{f_title}</b>", body_style))
                if f.get('description'):
                    desc = str(f['description']).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    story.append(Paragraph(desc, body_style))
                if f.get('academic_importance'):
                    imp = str(f['academic_importance']).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    story.append(Paragraph(f"<i>Academic Importance: {imp}</i>", body_style))
                story.append(Spacer(1, 10))
            story.append(PageBreak())

    # Report sections
    sections = [
        ("1. Abstract & Executive Summary", "abstract"),
        ("2. Introduction & Problem Formulation", "introduction"),
        ("3. Theoretical Framework & Literature Foundations", "literature_review"),
        ("4. Methodology & Analytical Pipeline", "methodology"),
        ("5. Empirical Findings & Key Insights", "findings"),
        ("6. Discussion & Practical Implications", "discussion"),
        ("7. Limitations & Ethical Governance", "limitations"),
        ("8. Conclusion & Future Recommendations", "conclusion"),
    ]
    for heading_text, key in sections:
        content = rc.get(key, "")
        if content:
            add_section(heading_text, content)

    # References
    references = rc.get("references", [])
    if references:
        story.append(Paragraph("References", h1_style))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8))
        for ref in references:
            safe_ref = str(ref).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            story.append(Paragraph(safe_ref, ref_style))

    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    buf.seek(0)
    return buf


def _build_md_content(report: ResearchReport, scope: str) -> str:
    """Build Markdown export content."""
    rc = report.report_content or {}
    lines = []
    lines.append(f"# {report.title}\n")
    lines.append(f"**Subject:** {report.subject}  ")
    lines.append(f"**Assignment Type:** {report.assignment_type}  ")
    lines.append(f"**Citation Style:** {report.citation_style}  ")
    lines.append(f"**Target Word Count:** {rc.get('word_target', report.word_count_estimate)} words  ")
    lines.append(f"**Actual Word Count:** {report.word_count_estimate} words  ")
    lines.append(f"**Date:** {report.created_at.strftime('%B %d, %Y')}\n")

    if scope == "complete":
        questions = rc.get("research_questions", [])
        if questions:
            lines.append("## Research Questions\n")
            for i, q in enumerate(questions, 1):
                lines.append(f"{i}. {q}")
            lines.append("")

        sources = rc.get("sources", [])
        if sources:
            lines.append("## Verified Academic Sources\n")
            for i, s in enumerate(sources, 1):
                lines.append(f"### {i}. {s.get('title', 'Unknown')}")
                lines.append(f"*{s.get('authors', '')} ({s.get('year', 'n.d.')})* — {s.get('publication_or_source', '')}  ")
                if s.get('doi') or s.get('url'):
                    lines.append(f"[Source Link]({s.get('doi') or s.get('url')})  ")
                if s.get('abstract'):
                    lines.append(f"\n> {s['abstract']}\n")
                lines.append("")

        findings = rc.get("key_findings", [])
        if findings:
            lines.append("## Key Empirical Findings\n")
            for f in findings:
                lines.append(f"### {f.get('title', '')}")
                lines.append(f"- **Evidence:** {f.get('description', '')}")
                if f.get('academic_importance'):
                    lines.append(f"- **Academic Importance:** {f.get('academic_importance')}")
                if f.get('limitations'):
                    lines.append(f"- **Limitations:** {f.get('limitations')}")
                lines.append("")

    sections = [
        ("1. Abstract & Executive Summary", "abstract"),
        ("2. Introduction & Problem Formulation", "introduction"),
        ("3. Theoretical Framework & Literature Foundations", "literature_review"),
        ("4. Methodology & Analytical Pipeline", "methodology"),
        ("5. Empirical Findings & Key Insights", "findings"),
        ("6. Discussion & Practical Implications", "discussion"),
        ("7. Limitations & Ethical Governance", "limitations"),
        ("8. Conclusion & Future Recommendations", "conclusion"),
    ]
    for heading, key in sections:
        content = rc.get(key, "")
        if content:
            lines.append(f"## {heading}\n")
            lines.append(f"{content}\n")

    references = rc.get("references", [])
    if references:
        lines.append("## References\n")
        for ref in references:
            lines.append(f"- {ref}")
        lines.append("")

    return "\n".join(lines)


@router.get("/reports/{report_id}/export/{format_type}")
def export_report(
    report_id: str,
    format_type: str,
    scope: str = "report",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export a report as PDF, DOCX, TXT, or MD.
    scope: 'report' = report sections + references only
           'complete' = questions + sources + findings + report + references
    """
    if format_type not in ("pdf", "docx", "txt", "md"):
        raise HTTPException(status_code=400, detail="Format must be pdf, docx, txt, or md.")
    if scope not in ("report", "complete"):
        raise HTTPException(status_code=400, detail="Scope must be 'report' or 'complete'.")

    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or unauthorized.")

    date_str = report.created_at.strftime("%Y%m%d")
    base_name = f"{_sanitize_filename(report.topic)}_{date_str}"

    try:
        if format_type == "txt":
            content = _build_txt_content(report, scope)
            return Response(
                content=content.encode("utf-8"),
                media_type="text/plain; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.txt"'}
            )

        elif format_type == "md":
            content = _build_md_content(report, scope)
            return Response(
                content=content.encode("utf-8"),
                media_type="text/markdown; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.md"'}
            )

        elif format_type == "docx":
            buf = _build_docx_content(report, scope)
            return StreamingResponse(
                buf,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.docx"'}
            )

        elif format_type == "pdf":
            buf = _build_pdf_content(report, scope)
            return StreamingResponse(
                buf,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{base_name}.pdf"'}
            )

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Export library not installed: {str(e)}. Run: pip install reportlab python-docx"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
