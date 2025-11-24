import os
import uvicorn
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database import init_db_pool, close_db_pool
from routers import (
    users, complaints, views, officers, evidence, assignments, actions, feedback, audit, database, auth
)

app = FastAPI(
    title="Complaint Management (Pure SQL) API",
    description="FastAPI backend using pure SQL (asyncpg). Swagger UI at /docs",
    version="1.0",
)

api_router = APIRouter(prefix="/api")

api_router.include_router(users.router, prefix="/users")
api_router.include_router(complaints.router, prefix="/complaints")
api_router.include_router(evidence.router, prefix="/evidence")
api_router.include_router(officers.router, prefix="/officers")
api_router.include_router(assignments.router, prefix="/assignments")
api_router.include_router(actions.router, prefix="/actions")
api_router.include_router(feedback.router, prefix="/feedback")
api_router.include_router(views.router, prefix="/views")
api_router.include_router(audit.router, prefix="/audit")
api_router.include_router(database.router, prefix="/database")
api_router.include_router(complaints.router, prefix="/categories")
api_router.include_router(auth.router, prefix="/auth")


# mount once
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db_pool()

@app.on_event("shutdown")
async def shutdown():
    await close_db_pool()

if __name__ == "__main__":
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", 5000)) 
    print(f"Server running on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)