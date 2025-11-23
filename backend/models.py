# app/models.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    role = Column(String)
    password_hash = Column(Text)

class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    category = Column(String)
    description = Column(Text)
    location = Column(String)
    status = Column(String)
    submitted_at = Column(TIMESTAMP)
    resolved_at = Column(TIMESTAMP)
    last_updated_at = Column(TIMESTAMP)

# COMPLAINTS
class ComplaintBase(BaseModel):
    user_id: int
    category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class Complaint(BaseModel):
    complaint_id: int
    user_id: int
    category: Optional[str]
    description: Optional[str]
    location: Optional[str]
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime]
    last_updated_at: datetime

    class Config:
        orm_mode = True

# EVIDENCE
class EvidenceCreate(BaseModel):
    file_path: str
    mime_type: Optional[str] = None

class ComplaintEvidence(BaseModel):
    evidence_id: int
    complaint_id: int
    file_path: str
    mime_type: Optional[str]
    uploaded_at: datetime

    class Config:
        orm_mode = True

# FEEDBACK
class FeedbackCreate(BaseModel):
    citizen_name: str
    complaint_id: int
    rating: int
    comments: Optional[str] = None

class Feedback(BaseModel):
    feedback_id: int
    complaint_id: int
    user_id: int
    rating: int
    comments: Optional[str]
    submitted_at: datetime

    class Config:
        orm_mode = True

# OFFICERS
class OfficerBase(BaseModel):
    user_id: int
    department: Optional[str] = None
    designation: Optional[str] = None

class OfficerCreate(OfficerBase):
    pass

class Officer(BaseModel):
    officer_id: int
    user_id: int
    department: Optional[str]
    designation: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

# ASSIGNMENTS
class AssignOfficer(BaseModel):
    officer_id: int
    assigned_by: Optional[int] = None

class ComplaintAssignment(BaseModel):
    assignment_id: int
    complaint_id: int
    officer_id: int
    assigned_by: Optional[int]
    assigned_at: datetime

    class Config:
        orm_mode = True

# ACTIONS
class ActionCreate(BaseModel):
    officer_id: int
    action_taken: str
    is_final: bool = False

class ComplaintAction(BaseModel):
    action_id: int
    complaint_id: int
    officer_id: int
    action_taken: str
    is_final: bool
    action_date: datetime

    class Config:
        orm_mode = True

# AUDIT
class AuditLogEntry(BaseModel):
    audit_id: int
    table_name: str
    operation: str
    primary_key: Dict[str, Any]
    changed_by: Optional[int]
    changed_at: datetime
    row_data: Dict[str, Any]

    class Config:
        orm_mode = True

# VIEWS
class ComplaintSummary(BaseModel):
    complaint_id: int
    category: Optional[str]
    description: Optional[str]
    location: Optional[str]
    status: str
    submitted_at: datetime
    resolved_at: Optional[datetime]
    last_updated_at: datetime
    citizen_id: int
    citizen_name: str
    citizen_email: str
    officer_id: Optional[int]
    officer_name: Optional[str]
    department: Optional[str]
    designation: Optional[str]

    class Config:
        orm_mode = True

class FeedbackSummary(BaseModel):
    feedback_id: int
    rating: int
    comments: Optional[str]
    submitted_at: datetime
    complaint_id: int
    citizen_name: str
    officer_name: Optional[str]

    class Config:
        orm_mode = True
