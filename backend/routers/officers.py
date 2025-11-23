from fastapi import APIRouter
from database import fetch, fetchrow, execute

router = APIRouter(tags=["Officers"])

@router.get("/", response_model=list)
async def list_officers():
    rows = await fetch("SELECT * FROM officers ORDER BY officer_id")
    return rows

@router.get("/{officer_id}", response_model=dict)
async def get_officer(officer_id: int):
    row = await fetchrow("SELECT * FROM officers WHERE officer_id = $1", officer_id)
    return row