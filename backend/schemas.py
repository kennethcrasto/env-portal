from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Users
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = Field(default="citizen", pattern="^(citizen|officer|admin)$")
    password_hash: str


class UserOut(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    role: str
    created_at: Optional[datetime]

# Complaints
class ComplaintCreate(BaseModel):
    user_id: int
    category: Optional[str]
    description: Optional[str]
    location: Optional[str]


class ComplaintOut(BaseModel):
    complaint_id: int
    user_id: int
    category: str
    description: str
    location: str
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None 

# ComplaintSummary view
class ComplaintSummaryOut(BaseModel):
    complaint_id: int
    category: Optional[str]
    description: Optional[str]
    location: Optional[str]
    status: Optional[str]
    submitted_at: Optional[datetime]
    resolved_at: Optional[datetime]
    last_updated_at: Optional[datetime]
    citizen_id: Optional[int]
    citizen_name: Optional[str]
    citizen_email: Optional[str]
    officer_id: Optional[int]
    officer_name: Optional[str]
    department: Optional[str]
    designation: Optional[str]
    
# Feedback
class FeedbackCreate(BaseModel):
    complaint_id: int
    user_id: int
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class FeedbackOut(BaseModel):
    feedback_id: int
    complaint_id: int
    user_id: int
    rating: int
    comments: Optional[str]
    submitted_at: Optional[datetime]


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = Field(default="citizen", pattern="^(citizen|officer|admin)$")
    password: str