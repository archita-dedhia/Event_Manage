from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., max_length=255)
    user_type: str = Field(..., pattern="^(student|admin)$")  # 'student' or 'admin'


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    # Explicit role requested at login; must match stored user_type
    user_type: str = Field(..., pattern="^(student|admin)$")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    full_name: Optional[str] = Field(None, max_length=255)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    user_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetail(UserOut):
    updated_at: datetime


# Category Schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Event Schemas
class EventCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    date: str  # Start Date: YYYY-MM-DD
    end_date: Optional[str] = None  # Optional End Date: YYYY-MM-DD
    time: str  # Start Time: HH:MM
    end_time: Optional[str] = None  # Optional End Time: HH:MM
    duration: Optional[str] = None  # Optional Duration
    location: str = Field(..., max_length=255)
    category_id: int
    capacity: int = Field(..., ge=1)
    image: Optional[str] = None
    pdf_url: Optional[str] = None
    website_url: Optional[str] = None
    is_rsvp_based: Optional[bool] = False
    rsvp_url: Optional[str] = None
    images: Optional[list[str]] = []


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    end_date: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    category_id: Optional[int] = None
    capacity: Optional[int] = None
    image: Optional[str] = None
    pdf_url: Optional[str] = None
    website_url: Optional[str] = None
    is_rsvp_based: Optional[bool] = None
    rsvp_url: Optional[str] = None
    images: Optional[list[str]] = None


class EventImageOut(BaseModel):
    id: int
    event_id: int
    url: str

    class Config:
        from_attributes = True


class EventOut(BaseModel):
    id: int
    title: str
    description: str
    date: str
    end_date: Optional[str] = None
    time: str
    end_time: Optional[str] = None
    duration: Optional[str] = None
    location: str
    category_id: int
    category_name: Optional[str] = None
    organizer_id: int
    capacity: int
    attendees: int
    image: Optional[str]
    pdf_url: Optional[str]
    website_url: Optional[str] = None
    is_rsvp_based: bool
    rsvp_url: Optional[str] = None
    images: list[EventImageOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class EventDetail(EventOut):
    updated_at: datetime
    category: CategoryOut
    organizer: UserOut


# Participant/Booking Schemas
class ParticipantCreate(BaseModel):
    event_id: int


class ParticipantOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    registered_at: datetime
    status: str

    class Config:
        from_attributes = True


class ParticipantDetail(ParticipantOut):
    user: UserOut
    event: EventOut


# Response Schemas
class MessageResponse(BaseModel):
    message: str
    success: bool


class LoginResponse(BaseModel):
    success: bool
    user: UserOut
    message: str


class AdminAnalytics(BaseModel):
    total_events: int
    total_attendees: int
    average_attendance: float

