from fastapi import APIRouter
from database import get_pool

router = APIRouter()

@router.get("/health")
async def health():
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT NOW() AS now")
            return {"ok": True, "time": row["now"]}
    except Exception as e:
        return {"ok": False, "error": str(e)}
