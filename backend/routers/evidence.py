from fastapi import APIRouter, HTTPException, status
from typing import List
from database import fetch, fetchrow, execute
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Evidence"])


class EvidenceCreate(BaseModel):
    complaint_id: int
    file_path: str
    mime_type: str


@router.get("/", response_model=List[dict])
async def list_evidence(limit: int = 100):
    rows = await fetch("SELECT * FROM complaintevidence ORDER BY uploaded_at DESC LIMIT $1", limit)
    return rows


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_evidence(payload: EvidenceCreate):
    q = """
    INSERT INTO complaintevidence (complaint_id, file_path, mime_type)
    VALUES ($1, $2, $3)
    RETURNING evidence_id, complaint_id, file_path, mime_type, uploaded_at
    """
    row = await fetchrow(q, payload.complaint_id, payload.file_path, payload.mime_type)
    return row

@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evidence(evidence_id: int):
    await execute("DELETE FROM complaintevidence WHERE evidence_id = $1", evidence_id)
    return None