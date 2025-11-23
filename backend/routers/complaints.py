from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import BaseModel
from database import fetch, fetchrow, execute
from schemas import ComplaintCreate, ComplaintOut

router = APIRouter(tags=["Complaints"])

# ✅ Define a specific model for status updates
class StatusUpdate(BaseModel):
    status: str

@router.get("/", response_model=List[ComplaintOut])
async def list_complaints(status: str | None = None, limit: int = 100):
    if status:
        rows = await fetch(
            "SELECT * FROM complaints WHERE status = $1 ORDER BY submitted_at DESC LIMIT $2",
            status, limit
        )
    else:
        rows = await fetch("SELECT * FROM complaints ORDER BY submitted_at DESC LIMIT $1", limit)
    return rows

@router.get("/stats")
async def get_complaint_stats():
    q = """
    SELECT 
        status,
        COUNT(*) AS count
    FROM complaints
    GROUP BY status
    ORDER BY status;
    """
    rows = await fetch(q)
    return rows

@router.get("/categories")
async def get_categories():
    rows = await fetch("SELECT DISTINCT category FROM complaints ORDER BY category")
    return [r['category'] for r in rows]

@router.post("/", response_model=ComplaintOut)
async def create_complaint(payload: ComplaintCreate):
    """
    Automatically assigns:
    - complaint_id via sequence
    - status = 'Pending'
    - submitted_at & last_updated_at = CURRENT_TIMESTAMP
    """
    q = """
    INSERT INTO complaints (user_id, category, description, location, status)
    VALUES ($1, $2, $3, $4, 'Pending')
    RETURNING complaint_id, user_id, category, description, location, status, submitted_at, resolved_at, last_updated_at
    """
    row = await fetchrow(q, payload.user_id, payload.category, payload.description, payload.location)
    return row

@router.get("/{complaint_id}", response_model=ComplaintOut)
async def get_complaint(complaint_id: int):
    row = await fetchrow("SELECT * FROM complaints WHERE complaint_id = $1", complaint_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return row

# ✅ This is the NEW route to fix the 404 error
@router.put("/{complaint_id}/status", response_model=ComplaintOut)
async def update_complaint_status(complaint_id: int, payload: StatusUpdate):
    q = """
    UPDATE complaints 
    SET status=$1, last_updated_at = CURRENT_TIMESTAMP
    WHERE complaint_id=$2
    RETURNING complaint_id, user_id, category, description, location, status, submitted_at, resolved_at, last_updated_at
    """
    row = await fetchrow(q, payload.status, complaint_id)
    if not row:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return row

@router.put("/{complaint_id}", response_model=ComplaintOut)
async def update_complaint(complaint_id: int, payload: ComplaintCreate):
    q = """
    UPDATE complaints SET category=$1, description=$2, location=$3, last_updated_at = CURRENT_TIMESTAMP
    WHERE complaint_id=$4
    RETURNING complaint_id, user_id, category, description, location, status, submitted_at, resolved_at, last_updated_at
    """
    row = await fetchrow(q, payload.category, payload.description, payload.location, complaint_id)
    if not row:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return row


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(complaint_id: int):
    await execute("DELETE FROM complaints WHERE complaint_id = $1", complaint_id)
    return None