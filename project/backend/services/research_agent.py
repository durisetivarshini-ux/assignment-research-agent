"""
AI Assignment Research Agent - Core Agent Service
This module defines the ResearchAgent class which leverages the Google Gemini API
to formulate research plans, gather scholarly concepts, synthesize findings,
organize academic citations, and draft full structured academic reports.
"""

import os
import json
import re
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

class ResearchAgent:
    """
    Intelligent Academic Research Agent capable of multi-step assignment research,
    source synthesis, and publication-ready academic report generation.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the agent with Gemini client.
        Reads GEMINI_API_KEY from environment if not explicitly passed.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key or self.api_key == "your_actual_gemini_api_key_here":
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file or environment."
            )
        
        # Initialize Google GenAI client
        self.client = genai.Client(api_key=self.api_key)
        self.candidate_models = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]

    def _call_gemini_with_fallback(self, prompt: str, system_instruction: str, temperature: float = 0.3) -> str:
        """
        Executes generate_content across candidate models to withstand transient spikes.
        """
        last_error = None
        for model in self.candidate_models:
            for attempt in range(1, 3):
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                            temperature=temperature
                        )
                    )
                    if response and response.text:
                        return response.text
                except Exception as e:
                    last_error = e
                    time_sleep = 0.5 * attempt
                    import time
                    time.sleep(time_sleep)
        raise RuntimeError(f"All candidate models failed: {last_error}")

    def _clean_json_text(self, text: str) -> str:
        """
        Helper method to remove Markdown code fence blocks (```json ... ```)
        and extract the raw JSON string safely.
        """
        text = text.strip()
        # Remove ```json or ``` at beginning
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        # Remove ``` at ending
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    def conduct_research(
        self,
        topic: str,
        subject: Optional[str] = None,
        question: Optional[str] = None,
        source_count: int = 5,
        citation_style: str = "APA 7th"
    ) -> Dict[str, Any]:
        """
        Multi-step research agent workflow:
        1. Analyzes the assignment topic and target academic discipline.
        2. Formulates sub-hypotheses and critical analytical themes.
        3. Identifies key empirical, methodological, and conceptual findings.
        4. Curates peer-reviewed and authoritative sources with formatted citations.
        5. Proposes future research questions.
        """
        if not topic or not topic.strip():
            raise ValueError("Research topic cannot be empty.")

        subject = (subject or "General Academic Discipline").strip()
        question = (
            question.strip()
            if question and question.strip()
            else f"What are the foundational principles, recent breakthroughs, and practical implications of {topic}?"
        )
        source_count = max(3, min(15, int(source_count)))

        system_instruction = (
            "You are an expert University Academic Research Agent and Scholar. "
            "Your objective is to conduct comprehensive, academically rigorous research "
            "for student assignments, producing factual summaries, high-impact findings, "
            "verified citation formats, and scholarly inquiries."
        )

        prompt = f"""
Conduct rigorous academic research on the following assignment topic:
- Assignment Topic: "{topic}"
- Academic Discipline / Subject: "{subject}"
- Core Research Question: "{question}"
- Required Number of Sources: {source_count}
- Target Citation Style: "{citation_style}"

Please return ONLY a valid JSON object matching the following structure exactly:
{{
  "success": true,
  "summary": "Thorough, 3-paragraph academic summary explaining theoretical foundations, contemporary state-of-the-art, and key challenges/significance.",
  "key_findings": [
    {{
      "id": 1,
      "title": "Concise, descriptive title of the finding",
      "description": "Comprehensive explanation of empirical or theoretical evidence, historical trajectory, or quantitative significance.",
      "impact_level": "Critical" | "High" | "Moderate",
      "takeaway": "Key takeaway for students writing on this topic."
    }}
  ],
  "sources": [
    {{
      "id": 1,
      "title": "Title of paper, seminal textbook, or authoritative industry/institutional report",
      "authors": "Author name(s) or Research Collective",
      "year": 2024,
      "publication_or_source": "Journal Name, Conference Proceedings, or University Press",
      "citation": "Complete formatted citation string in {citation_style} format",
      "key_contribution": "1-2 sentences summarizing the specific findings or methodology contributed by this source.",
      "credibility_rating": "Peer-Reviewed Journal / High Impact"
    }}
  ],
  "research_questions": [
    "Compelling follow-up research question focusing on technical, ethical, or methodological angles",
    "Comparative analysis question",
    "Future trajectory question"
  ],
  "topic_metadata": {{
    "subject": "{subject}",
    "scope_level": "Undergraduate / Graduate Academic Level",
    "recommended_methodology": "Literature Synthesis & Thematic Analysis"
  }}
}}

Provide exactly {source_count} distinct, authoritative sources. Ensure high scholarly quality suitable for higher education grading.
"""

        try:
            raw_text = self._call_gemini_with_fallback(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.3
            )
            cleaned_text = self._clean_json_text(raw_text)
            data = json.loads(cleaned_text)

            # Ensure response follows expected schema
            return {
                "success": True,
                "summary": data.get("summary", f"Research summary on {topic}"),
                "key_findings": data.get("key_findings", []),
                "sources": data.get("sources", []),
                "research_questions": data.get("research_questions", []),
                "topic_metadata": data.get("topic_metadata", {
                    "subject": subject,
                    "scope_level": "Undergraduate / Graduate Academic Level"
                })
            }
        except Exception as e:
            raise RuntimeError(f"AI Research Agent encountered an error during research synthesis: {str(e)}")

    def generate_report(
        self,
        topic: str,
        subject: Optional[str] = None,
        question: Optional[str] = None,
        citation_style: str = "APA 7th",
        sources: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generates a complete, publication-grade academic research paper report
        structured into the 8 mandatory sections:
        1. Abstract
        2. Introduction
        3. Literature Review
        4. Methodology
        5. Results/Findings
        6. Discussion
        7. Conclusion
        8. References
        """
        if not topic or not topic.strip():
            raise ValueError("Topic is required to generate a research report.")

        subject = (subject or "General Academic Discipline").strip()
        question = (
            question.strip()
            if question and question.strip()
            else f"Comprehensive academic investigation into {topic}"
        )
        sources_context = json.dumps(sources or [])[:1500]

        system_instruction = (
            "You are an esteemed Academic Faculty Member and Research Agent. "
            "You write articulate, highly detailed, and mathematically/theoretically "
            "grounded academic reports for university students. You adhere strictly "
            "to formal academic paper organization."
        )

        prompt = f"""
Write a complete, structured academic research report on:
- Topic: "{topic}"
- Subject/Discipline: "{subject}"
- Central Research Question: "{question}"
- Citation Style: "{citation_style}"
- Reference Material/Context: {sources_context}

The generated report MUST include all 8 required sections:
1. Abstract (200-250 words summarizing the study)
2. Introduction (Problem statement, context, research significance)
3. Literature Review (Thematic synthesis of existing literature & gaps)
4. Methodology (Analytical framework, evaluation criteria, research design)
5. Results/Findings (Empirical or conceptual analysis of the key findings)
6. Discussion (Implications, comparative insights, limitations)
7. Conclusion (Summary of contributions, future directions)
8. References (Formatted according to {citation_style})

Return ONLY a valid JSON object matching this schema:
{{
  "title": "A Formal Academic Paper Title on {topic}",
  "topic": "{topic}",
  "subject": "{subject}",
  "citation_style": "{citation_style}",
  "word_count_estimate": 2400,
  "abstract": "Full abstract text...",
  "introduction": "Full introduction text including background, problem statement, and scope...",
  "literature_review": "Full literature review analyzing major academic schools of thought...",
  "methodology": "Detailed research methodology and analytical approach...",
  "findings": "Comprehensive findings and results organized logically...",
  "discussion": "Scholarly discussion of theoretical and practical implications, plus limitations...",
  "conclusion": "Final concluding remarks and future recommendations...",
  "references": [
    "Full citation 1 in {citation_style}",
    "Full citation 2 in {citation_style}",
    "Full citation 3 in {citation_style}",
    "Full citation 4 in {citation_style}",
    "Full citation 5 in {citation_style}"
  ]
}}
"""

        try:
            raw_text = self._call_gemini_with_fallback(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.35
            )
            cleaned_text = self._clean_json_text(raw_text)
            report = json.loads(cleaned_text)

            return {
                "success": True,
                "report": report
            }
        except Exception as e:
            raise RuntimeError(f"AI Research Agent encountered an error generating the report: {str(e)}")
