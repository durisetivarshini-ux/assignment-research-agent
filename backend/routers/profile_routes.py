"""
Profile and Preferences routes for AI Assignment Research Agent.
Enforces record ownership: a student can only view or modify their own profile.
"""

from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, StudentProfile, UserPreference
from backend.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Student Profile"])


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    student_id: Optional[str] = Field(None, max_length=100)
    college: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    academic_level: Optional[str] = Field("Undergraduate", max_length=100)
    year_semester: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UpdatePreferencesRequest(BaseModel):
    theme: Optional[str] = Field(None, pattern="^(light|dark|system)$")
    sidebar_collapsed: Optional[bool] = None
    default_citation_style: Optional[str] = Field(None, max_length=50)


@router.get("")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Fetch current student profile."""
    profile = current_user.profile
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    return {
        "email": current_user.email,
        "is_student_verified": current_user.is_student_verified,
        "full_name": profile.full_name,
        "student_id": profile.student_id or "",
        "college": profile.college or "",
        "department": profile.department or "",
        "academic_level": profile.academic_level or "Undergraduate",
        "year_semester": profile.year_semester or "",
        "avatar_url": profile.avatar_url or ""
    }


@router.put("")
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update student profile information.
    Persists to database and immediately returns updated data.
    """
    profile = current_user.profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    profile.full_name = payload.full_name.strip()
    profile.student_id = payload.student_id.strip() if payload.student_id else None
    profile.college = payload.college.strip() if payload.college else None
    profile.department = payload.department.strip() if payload.department else None
    profile.academic_level = payload.academic_level.strip() if payload.academic_level else "Undergraduate"
    profile.year_semester = payload.year_semester.strip() if payload.year_semester else None
    profile.avatar_url = payload.avatar_url.strip() if payload.avatar_url else None

    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "message": "Student profile updated successfully.",
        "profile": {
            "email": current_user.email,
            "is_student_verified": current_user.is_student_verified,
            "full_name": profile.full_name,
            "student_id": profile.student_id or "",
            "college": profile.college or "",
            "department": profile.department or "",
            "academic_level": profile.academic_level,
            "year_semester": profile.year_semester or "",
            "avatar_url": profile.avatar_url or ""
        }
    }


@router.put("/preferences")
def update_preferences(
    payload: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update student preferences (theme, collapsed sidebar, citation style)."""
    pref = current_user.preference
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if payload.theme is not None:
        pref.theme = payload.theme
    if payload.sidebar_collapsed is not None:
        pref.sidebar_collapsed = payload.sidebar_collapsed
    if payload.default_citation_style is not None:
        pref.default_citation_style = payload.default_citation_style

    db.commit()
    db.refresh(pref)

    return {
        "success": True,
        "preferences": {
            "theme": pref.theme,
            "sidebar_collapsed": pref.sidebar_collapsed,
            "default_citation_style": pref.default_citation_style
        }
    }
