from fastapi import APIRouter
from database import fetch

router = APIRouter(tags=["Audit"])

# Changed from "/logs" to "/" to match frontend call to /api/audit-log
@router.get("/")
async def get_audit_logs(limit: int = 100):
    rows = await fetch("SELECT * FROM auditlog ORDER BY changed_at DESC LIMIT $1", limit)
    return rows