from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid

# Utility function for generating IDs
def generate_id():
    return str(uuid.uuid4())

# Enums for status fields
class ProjectStatus(str, Enum):
    active = "active"
    completed = "completed"
    on_hold = "on-hold"
    cancelled = "cancelled"

class InvoiceStatus(str, Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"

# Client Models
class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    is_active: bool = Field(default=True)

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

class Client(ClientBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Project Models
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    client_id: str = Field(..., min_length=1)
    hourly_rate: float = Field(..., ge=0)
    currency: str = Field(default="EUR", pattern=r'^[A-Z]{3}$')
    start_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    end_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    status: ProjectStatus = Field(default=ProjectStatus.active)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    client_id: Optional[str] = Field(None, min_length=1)
    hourly_rate: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, pattern=r'^[A-Z]{3}$')
    start_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    end_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    status: Optional[ProjectStatus] = None

class Project(ProjectBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Time Entry Models
class TimeEntryBase(BaseModel):
    project_id: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1, max_length=500)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: int = Field(..., ge=1)  # duration in minutes
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    is_manual: bool = Field(default=True)

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryUpdate(BaseModel):
    project_id: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = Field(None, ge=1)
    date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    is_manual: Optional[bool] = None

class TimeEntry(TimeEntryBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Invoice Models
class InvoiceBase(BaseModel):
    client_id: str = Field(..., min_length=1)
    project_id: str = Field(..., min_length=1)
    invoice_number: str = Field(..., min_length=1, max_length=50)
    issue_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    due_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    total_hours: float = Field(..., ge=0)
    total_amount: float = Field(..., ge=0)
    currency: str = Field(default="EUR", pattern=r'^[A-Z]{3}$')
    status: InvoiceStatus = Field(default=InvoiceStatus.draft)
    time_entries: List[str] = Field(default_factory=list)
    custom_description: Optional[str] = Field(None, max_length=1000)

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    client_id: Optional[str] = Field(None, min_length=1)
    project_id: Optional[str] = Field(None, min_length=1)
    invoice_number: Optional[str] = Field(None, min_length=1, max_length=50)
    issue_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    due_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    total_hours: Optional[float] = Field(None, ge=0)
    total_amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, pattern=r'^[A-Z]{3}$')
    status: Optional[InvoiceStatus] = None
    time_entries: Optional[List[str]] = None
    custom_description: Optional[str] = Field(None, max_length=1000)

class Invoice(InvoiceBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Active Timer Model
class ActiveTimerBase(BaseModel):
    project_id: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1, max_length=500)
    start_time: datetime = Field(default_factory=datetime.utcnow)

class ActiveTimerCreate(ActiveTimerBase):
    pass

class ActiveTimer(ActiveTimerBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Response Models
class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None

# Timer Operation Models
class TimerStartRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1, max_length=500)

class TimerStopResponse(BaseModel):
    success: bool = True
    message: str
    time_entry: TimeEntry
