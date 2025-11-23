from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from database import fetch, fetchrow, execute
from schemas import FeedbackCreate, FeedbackOut

router = APIRouter(tags=["Feedback"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_feedback(limit: int = 100):
    query = """
        SELECT feedback_id, complaint_id, user_id, rating, comments, submitted_at 
        FROM feedback 
        ORDER BY submitted_at DESC 
        LIMIT $1
    """
    rows = await fetch(query, limit)
    return [dict(row) for row in rows]

@router.get("/{feedback_id}", response_model=FeedbackOut)
async def get_feedback(feedback_id: int):
    row = await fetchrow("SELECT * FROM feedback WHERE feedback_id = $1", feedback_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    return row

@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
async def create_feedback(payload: FeedbackCreate):
    # 1. VALIDATION: Check if IDs exist to prevent 500 Crashes
    user_exists = await fetchrow("SELECT 1 FROM users WHERE user_id = $1", payload.user_id)
    if not user_exists:
        raise HTTPException(status_code=404, detail=f"User ID {payload.user_id} not found")

    complaint_exists = await fetchrow("SELECT 1 FROM complaints WHERE complaint_id = $1", payload.complaint_id)
    if not complaint_exists:
        raise HTTPException(status_code=404, detail=f"Complaint ID {payload.complaint_id} not found")

    # 2. INSERT
    q = """
    INSERT INTO feedback (complaint_id, user_id, rating, comments)
    VALUES ($1, $2, $3, $4)
    RETURNING feedback_id, complaint_id, user_id, rating, comments, submitted_at
    """
    try:
        row = await fetchrow(q, payload.complaint_id, payload.user_id, payload.rating, payload.comments)
        return row
    except Exception as e:
        print(f"DB Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))