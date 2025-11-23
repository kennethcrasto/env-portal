from fastapi import APIRouter
from database import fetch, fetchrow, execute

router = APIRouter(tags=["Actions"])


@router.get("/", response_model=list)
async def list_actions():
    rows = await fetch("SELECT * FROM complaintactions ORDER BY action_date DESC")
    return rows


@router.post("/", status_code=201)
async def add_action(complaint_id: int, officer_id: int, action_taken: str, is_final: bool = False):
    q = """
    INSERT INTO complaintactions (complaint_id, officer_id, action_taken, is_final)
    VALUES ($1,$2,$3,$4)
    RETURNING action_id, complaint_id, officer_id, action_taken, is_final, action_date
    """
    row = await fetchrow(q, complaint_id, officer_id, action_taken, is_final)
    return row
