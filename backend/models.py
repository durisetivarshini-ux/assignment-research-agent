"""
SQLAlchemy Models for AI Assignment Research Agent.
Persists Users, Student Profiles, Preferences, Sessions, Files, Research, and Reports.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_student_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preference = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    files = relationship("UploadedFile", back_populates="user", cascade="all, delete-orphan")
    research_requests = relationship("ResearchRequest", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("ResearchReport", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    student_id = Column(String(100), nullable=True)
    college = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    academic_level = Column(String(100), default="Undergraduate")
    year_semester = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="profile")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String(20), default="dark")  # "light", "dark", "system"
    sidebar_collapsed = Column(Boolean, default=False)
    default_citation_style = Column(String(50), default="APA")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="preference")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(64), primary_key=True, default=generate_uuid)  # Session token
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    mime_type = Column(String(100), nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="files")


class ResearchRequest(Base):
    __tablename__ = "research_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(500), nullable=False)
    subject = Column(String(255), default="General Academic Discipline")
    assignment_type = Column(String(100), default="Research Paper")
    word_target = Column(Integer, default=2000)
    citation_style = Column(String(50), default="APA")
    guidelines = Column(Text, nullable=True)
    status = Column(String(50), default="completed")  # "processing", "completed", "failed"
    summary = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=True)  # List of finding objects
    sources = Column(JSON, nullable=True)  # List of source objects
    research_questions = Column(JSON, nullable=True)  # List of questions
    file_id = Column(String(36), ForeignKey("uploaded_files.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="research_requests")
    reports = relationship("ResearchReport", back_populates="request", cascade="all, delete-orphan")


class ResearchReport(Base):
    __tablename__ = "research_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(String(36), ForeignKey("research_requests.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    topic = Column(String(500), nullable=False)
    subject = Column(String(255), default="General Academic Discipline")
    assignment_type = Column(String(100), default="Research Paper")
    citation_style = Column(String(50), default="APA")
    word_count_estimate = Column(Integer, default=2000)
    abstract = Column(Text, nullable=True)
    report_content = Column(JSON, nullable=False)  # full sections: intro, lit_review, methodology, findings, discussion, conclusion, references
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reports")
    request = relationship("ResearchRequest", back_populates="reports")
