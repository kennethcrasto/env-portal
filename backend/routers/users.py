from fastapi import APIRouter, HTTPException, status
from typing import List
from database import fetch, fetchrow, execute
from schemas import UserCreate, UserOut

router = APIRouter(tags=["Users"])


@router.get("/", response_model=List[UserOut])
async def list_users():
    rows = await fetch(
        "SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY user_id"
    )
    return rows


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int):
    row = await fetchrow(
        "SELECT user_id, name, email, phone, role, created_at FROM users WHERE user_id = $1",
        user_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return row


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
    # Insert and return created row
    query = """
    INSERT INTO users(name, email, phone, role, password_hash)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING user_id, name, email, phone, role, created_at
    """
    try:
        row = await fetchrow(query, payload.name, payload.email, payload.phone, payload.role, payload.password_hash)
        return row
    except Exception as e:
        # simple conflict handling
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    await execute("DELETE FROM users WHERE user_id = $1", user_id)
    return None
