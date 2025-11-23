# app/routers/stats.py
from fastapi import APIRouter
from database import get_pool

router = APIRouter()

@router.get("/complaints/stats")
async def complaints_stats():
    pool = await get_pool()
    async with pool.acquire() as conn:
        r = await conn.fetchrow("""
            SELECT
              COUNT(*)::int AS totalComplaints,
              COUNT(*) FILTER (WHERE status='Pending')::int AS pending,
              COUNT(*) FILTER (WHERE status='Resolved')::int AS resolved,
              COUNT(*) FILTER (WHERE status='In Progress')::int AS inProgress,
              COUNT(*) FILTER (WHERE status='Closed')::int AS closed,
              COUNT(*) FILTER (WHERE status='Rejected')::int AS rejected
            FROM Complaints
        """)
        return dict(r)
