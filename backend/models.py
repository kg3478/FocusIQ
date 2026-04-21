"""
FocusIQ — SQLAlchemy ORM Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    image = Column(String)
    daily_hours = Column(Float, default=4.0)
    preferred_time = Column(String, default="morning")
    onboarded = Column(Boolean, default=False)
    plan = Column(String, default="free")  # free | pro
    created_at = Column(DateTime, default=datetime.utcnow)

    subjects = relationship("Subject", back_populates="user", cascade="all, delete")
    sessions = relationship("Session", back_populates="user", cascade="all, delete")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    difficulty = Column(Integer, default=3)  # 1-5
    exam_date = Column(DateTime, nullable=True)

    # SM-2 fields
    interval = Column(Integer, default=1)       # days until next review
    repetitions = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    next_review = Column(DateTime, default=datetime.utcnow)
    last_studied = Column(DateTime, nullable=True)

    # Stats
    total_minutes = Column(Integer, default=0)
    avg_focus = Column(Float, default=0.0)
    session_count = Column(Integer, default=0)
    struggling = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subjects")
    sessions = relationship("Session", back_populates="subject")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    subject_name = Column(String)
    minutes = Column(Integer, nullable=False)
    focus_rating = Column(Integer, nullable=False)  # 1-5
    note = Column(Text, default="")
    sentiment = Column(String, default="neutral")   # positive | neutral | negative
    date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")
