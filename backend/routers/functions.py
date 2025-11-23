# backend/routers/functions.py
from fastapi import APIRouter, HTTPException
from typing import List
from database import fetch, fetchrow
from schemas import OfficerWorkloadOut

router = APIRouter(prefix="/functions", tags=["Functions"])

@router.get("/file_complaint/{user_id}")
async def file_complaint(user_id: int, category: str, description: str, location: str):
    row = await fetchrow("SELECT file_complaint($1,$2,$3,$4) AS complaint_id", user_id, category, description, location)
    if not row:
        raise HTTPException(status_code=400, detail="Could not file complaint")
    return {"complaint_id": row["complaint_id"]}

@router.get("/officer_workload/{officer_id}", response_model=List[OfficerWorkloadOut])
async def officer_workload(officer_id: int):
    rows = await fetch("SELECT * FROM officer_workload($1)", officer_id)
    return rows

@router.get("/complaints_by_status")
async def complaints_by_status(status: str, limit: int = 100):
    rows = await fetch("SELECT * FROM complaints_by_status($1) LIMIT $2", status, limit)
    return rows
