from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship

from .database import Base

def get_ist_time():
    # UTC + 5:30
    ist_offset = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_offset)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    user_type = Column(String(50), nullable=False)  # 'student' or 'admin'
    created_at = Column(DateTime, default=get_ist_time, nullable=False)
    updated_at = Column(DateTime, default=get_ist_time, onupdate=get_ist_time)

    # Relationships
    events_created = relationship("Event", back_populates="organizer")
    participations = relationship("Participant", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_ist_time, nullable=False)

    # Relationships
    events = relationship("Event", back_populates="category")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    date = Column(String(50), nullable=False)  # Start Date: YYYY-MM-DD
    end_date = Column(String(50), nullable=True)  # Optional End Date: YYYY-MM-DD
    time = Column(String(50), nullable=False)  # Start Time: HH:MM
    end_time = Column(String(50), nullable=True)  # Optional End Time: HH:MM
    duration = Column(String(100), nullable=True)  # e.g., "2 hours", "3 days"
    location = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    capacity = Column(Integer, nullable=False)
    attendees = Column(Integer, default=0)
    image = Column(Text, nullable=True)  # Image identifier/URL
    pdf_url = Column(Text, nullable=True)  # PDF identifier/URL
    website_url = Column(Text, nullable=True) #Optional website link
    is_rsvp_based = Column(Boolean, default=False)
    rsvp_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_ist_time, nullable=False)
    updated_at = Column(DateTime, default=get_ist_time, onupdate=get_ist_time)

    # Relationships
    category = relationship("Category", back_populates="events")
    organizer = relationship("User", back_populates="events_created")
    participants = relationship("Participant", back_populates="event", cascade="all, delete-orphan")
    images = relationship("EventImage", back_populates="event", cascade="all, delete-orphan")

    @property
    def category_name(self):
        return self.category.name if self.category else None


class EventImage(Base):
    __tablename__ = "event_images"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_ist_time, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="images")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    registered_at = Column(DateTime, default=get_ist_time, nullable=False)
    status = Column(String(50), default="registered", nullable=False)  # registered, attended, cancelled

    # Relationships
    user = relationship("User", back_populates="participations")
    event = relationship("Event", back_populates="participants")

