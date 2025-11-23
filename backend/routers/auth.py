from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from database import fetchrow
from schemas import UserRegister, UserOut

router = APIRouter(tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    # Check if email already exists
    exists = await fetchrow("SELECT user_id FROM users WHERE email = $1", payload.email)
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )

    # Hash the password (NEVER store plain text!)
    hashed_password = pwd_context.hash(payload.password)

    # 3 Insert into Database
    query = """
        INSERT INTO users (name, email, phone, role, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id, name, email, phone, role, created_at
    """
    
    try:
        row = await fetchrow(
            query, 
            payload.name, 
            payload.email, 
            payload.phone, 
            payload.role, 
            hashed_password
        )
        return row
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))