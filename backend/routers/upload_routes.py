"""
File upload and assignment brief processing routes.
Validates file extensions (PDF, DOCX, TXT) and enforces the 15MB limit.
Safely stores files and protects access via record ownership checks.
"""

import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, UploadedFile
from backend.auth import get_current_user

router = APIRouter(prefix="/api/upload", tags=["File Uploads"])

UPLOAD_DIR = Path("./backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


@router.post("")
async def upload_assignment_brief(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and validate an assignment brief file (PDF, DOCX, TXT, Max 15MB).
    Enforces student ownership and persists metadata.
    """
    original_name = file.filename or "assignment_brief.txt"
    file_ext = Path(original_name).suffix.lower()

    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: PDF, DOCX, TXT."
        )

    # Read content and check size
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the 15MB limit (size: {file_size / (1024*1024):.2f}MB). Please upload a smaller brief."
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a valid document."
        )

    # Generate safe unique filename
    unique_stored_name = f"{uuid.uuid4().hex}_{Path(original_name).name}"
    storage_path = UPLOAD_DIR / unique_stored_name

    with open(storage_path, "wb") as f:
        f.write(content)

    # Extract sample text if text file
    extracted_text = ""
    if file_ext == ".txt":
        try:
            extracted_text = content.decode("utf-8", errors="replace")[:3000]
        except Exception:
            pass

    # Save to database
    file_record = UploadedFile(
        user_id=current_user.id,
        original_name=original_name,
        stored_name=unique_stored_name,
        storage_path=str(storage_path),
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        extracted_text=extracted_text
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    return {
        "success": True,
        "message": "Assignment brief uploaded successfully.",
        "file": {
            "id": file_record.id,
            "original_name": file_record.original_name,
            "file_size": file_record.file_size,
            "mime_type": file_record.mime_type,
            "created_at": file_record.created_at.isoformat()
        }
    }


@router.get("/{file_id}")
def download_assignment_brief(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download uploaded assignment file. Enforces record ownership.
    """
    file_record = db.query(UploadedFile).filter(
        UploadedFile.id == file_id,
        UploadedFile.user_id == current_user.id
    ).first()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or unauthorized access."
        )

    file_path = Path(file_record.storage_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file no longer exists on disk."
        )

    return FileResponse(
        path=file_path,
        filename=file_record.original_name,
        media_type=file_record.mime_type
    )
