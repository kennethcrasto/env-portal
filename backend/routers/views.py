from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from database import fetch, fetchrow

router = APIRouter(tags=["Views & Functions"])

@router.get("/complaint_summary", response_model=List[Dict[str, Any]])
async def complaint_summary(limit: int = 100):
    """
    Fetches data for the Admin Dashboard graphs.
    Converts asyncpg Records to Dicts to prevent serialization errors.
    """
    # Query the view ComplaintSummary
    rows = await fetch("SELECT * FROM complaintsummary ORDER BY submitted_at DESC LIMIT $1", limit)
    # ✅ FIX: Convert Record objects to dictionaries
    return [dict(row) for row in rows]


@router.get("/feedback_summary", response_model=List[Dict[str, Any]])
async def feedback_summary(limit: int = 100):
    rows = await fetch("SELECT * FROM feedbacksummary ORDER BY submitted_at DESC LIMIT $1", limit)
    # ✅ FIX: Convert Record objects to dictionaries
    return [dict(row) for row in rows]


@router.get("/file_complaint/{user_id}")
async def file_complaint(user_id: int, category: str, description: str, location: str):
    # Call the SQL function file_complaint
    row = await fetchrow("SELECT file_complaint($1,$2,$3,$4) AS complaint_id", user_id, category, description, location)
    if not row:
        raise HTTPException(status_code=400, detail="Could not file complaint")
    # This was already fine because you manually constructed the dict
    return {"complaint_id": row["complaint_id"]}


@router.get("/officer_workload/{officer_id}")
async def officer_workload(officer_id: int):
    rows = await fetch("SELECT * FROM officer_workload($1)", officer_id)
    # ✅ FIX: Convert Record objects to dictionaries
    return [dict(row) for row in rows]