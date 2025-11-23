from fastapi import APIRouter, HTTPException, status
from database import fetch, fetchrow, execute

router = APIRouter(tags=["Assignments"])


@router.get("/", response_model=list)
async def list_assignments():
    rows = await fetch("SELECT * FROM complaintassignments ORDER BY assigned_at DESC")
    return rows


@router.post("/", status_code=status.HTTP_201_CREATED)
async def assign_complaint(complaint_id: int, officer_id: int, assigned_by: int | None = None):
    q = """
    INSERT INTO complaintassignments (complaint_id, officer_id, assigned_by)
    VALUES ($1, $2, $3)
    RETURNING assignment_id, complaint_id, officer_id, assigned_by, assigned_at
    """
    row = await fetchrow(q, complaint_id, officer_id, assigned_by)
    return row
