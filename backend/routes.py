"""
FocusIQ — FastAPI Routes
All API endpoints for the frontend to consume.
Users are identified by X-User-Email header (set by frontend after NextAuth login).
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
from models import User, Subject, Session as StudySession
from scheduler import build_schedule, generate_reminders, apply_sm2, days_since
from sentiment import analyze_note

router = APIRouter()


# ── Pydantic Schemas ─────────────────────────────────────────────────────────

class SubjectIn(BaseModel):
    name: str
    difficulty: int = 3
    examDate: Optional[str] = None


class OnboardingIn(BaseModel):
    subjects: List[SubjectIn]
    dailyHours: float = 4.0
    preferredTime: str = "morning"


class SessionIn(BaseModel):
    subjectId: int
    minutes: int
    focusRating: int
    note: Optional[str] = ""


class UserSync(BaseModel):
    email: str
    name: Optional[str] = None
    image: Optional[str] = None


# ── Helper ────────────────────────────────────────────────────────────────────

def get_or_create_user(email: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=email.split("@")[0])
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def require_user(
    x_user_email: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Missing X-User-Email header")
    return get_or_create_user(x_user_email, db)


# ── Auth / User Sync ──────────────────────────────────────────────────────────

@router.post("/api/user/sync")
def sync_user(body: UserSync, db: Session = Depends(get_db)):
    """Called by frontend after login to sync user to SQLite. Adds seed data if new."""
    try:
        user = db.query(User).filter(User.email == body.email).first()
        is_new_user = False
        if not user:
            is_new_user = True
            user = User(email=body.email, name=body.name, image=body.image)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if body.name:
                user.name = body.name
            if body.image:
                user.image = body.image
            db.commit()

        if is_new_user:
            demo_subjects = [
                {"name": "Data Structures & Algorithms", "difficulty": 5},
                {"name": "Database Management Systems", "difficulty": 4},
                {"name": "Operating Systems", "difficulty": 5},
                {"name": "Computer Networks", "difficulty": 3},
            ]
            for s in demo_subjects:
                db.add(Subject(user_id=user.id, name=s["name"], difficulty=s["difficulty"]))
            user.onboarded = True
            user.daily_hours = 4.0
            db.commit()
            db.refresh(user)

        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "onboarded": user.onboarded,
            "plan": user.plan,
            "dailyHours": user.daily_hours,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Onboarding ────────────────────────────────────────────────────────────────

@router.post("/api/onboarding")
def onboard(body: OnboardingIn, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Save subjects and preferences, mark user as onboarded."""
    user.daily_hours = body.dailyHours
    user.preferred_time = body.preferredTime
    user.onboarded = True

    # Delete old subjects
    db.query(Subject).filter(Subject.user_id == user.id).delete()

    # Add new subjects
    for s in body.subjects:
        exam_dt = None
        if s.examDate:
            try:
                exam_dt = datetime.fromisoformat(s.examDate)
            except ValueError:
                pass
        db.add(Subject(
            user_id=user.id,
            name=s.name,
            difficulty=s.difficulty,
            exam_date=exam_dt,
        ))

    db.commit()
    return {"success": True, "message": "Onboarding complete"}


# ── Schedule ──────────────────────────────────────────────────────────────────

@router.get("/api/schedule")
def get_schedule(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Return today's AI-generated study schedule and reminders."""
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    schedule = build_schedule(subjects, user.daily_hours or 4.0)
    reminders = generate_reminders(subjects)
    return {"schedule": schedule, "reminders": reminders}


# ── Sessions ──────────────────────────────────────────────────────────────────

@router.post("/api/session")
def log_session(body: SessionIn, user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Log a study session, apply SM-2, update subject stats."""
    subject = db.query(Subject).filter(
        Subject.id == body.subjectId,
        Subject.user_id == user.id,
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Sentiment analysis
    sentiment = analyze_note(body.note or "")

    # Create session record
    session_rec = StudySession(
        user_id=user.id,
        subject_id=subject.id,
        subject_name=subject.name,
        minutes=body.minutes,
        focus_rating=body.focusRating,
        note=body.note or "",
        sentiment=sentiment["label"],
    )
    db.add(session_rec)

    # Apply SM-2
    sm2 = apply_sm2(subject, body.focusRating)
    subject.interval = sm2["interval"]
    subject.repetitions = sm2["repetitions"]
    subject.ease_factor = sm2["ease_factor"]
    subject.next_review = sm2["next_review"]
    subject.last_studied = datetime.utcnow()
    subject.total_minutes = (subject.total_minutes or 0) + body.minutes

    # Update running average focus
    n = subject.session_count or 0
    subject.avg_focus = round(((subject.avg_focus or 0) * n + body.focusRating) / (n + 1), 1)
    subject.session_count = n + 1
    subject.struggling = sentiment["struggling"]

    db.commit()
    db.refresh(session_rec)

    return {
        "success": True,
        "sessionId": session_rec.id,
        "sentiment": sentiment,
        "sm2": sm2,
    }


@router.get("/api/sessions")
def get_sessions(
    limit: int = 100,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Fetch user study sessions (newest first)."""
    sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == user.id)
        .order_by(StudySession.date.desc())
        .limit(limit)
        .all()
    )
    return {
        "sessions": [
            {
                "id": s.id,
                "subjectId": s.subject_id,
                "subjectName": s.subject_name,
                "minutes": s.minutes,
                "focusRating": s.focus_rating,
                "note": s.note,
                "sentiment": s.sentiment,
                "date": s.date.isoformat(),
            }
            for s in sessions
        ]
    }


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/api/analytics")
def get_analytics(user: User = Depends(require_user), db: Session = Depends(get_db)):
    """Return aggregated analytics data."""
    sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == user.id)
        .order_by(StudySession.date.asc())
        .all()
    )
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()

    # Streak calculation
    from collections import defaultdict
    day_set = set(s.date.date().isoformat() for s in sessions)
    streak = 0
    today = datetime.utcnow().date()
    for i in range(365):
        d = (today - timedelta(days=i)).isoformat()
        if d in day_set:
            streak += 1
        else:
            break

    # Total stats
    total_minutes = sum(s.minutes for s in sessions)
    avg_focus = round(sum(s.focus_rating for s in sessions) / len(sessions), 1) if sessions else 0

    # Last 7 days daily breakdown
    daily = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_sessions = [s for s in sessions if s.date.date() == d]
        daily.append({
            "label": d.strftime("%a %-d"),
            "minutes": sum(s.minutes for s in day_sessions),
            "focus": round(sum(s.focus_rating for s in day_sessions) / len(day_sessions), 1) if day_sessions else 0,
            "sessions": len(day_sessions),
        })

    # Subject breakdown
    subject_map = defaultdict(lambda: {"minutes": 0, "sessions": 0, "focus_sum": 0})
    for s in sessions:
        subject_map[s.subject_name]["minutes"] += s.minutes
        subject_map[s.subject_name]["sessions"] += 1
        subject_map[s.subject_name]["focus_sum"] += s.focus_rating

    subject_data = [
        {
            "name": name,
            "minutes": v["minutes"],
            "sessions": v["sessions"],
            "avgFocus": round(v["focus_sum"] / v["sessions"], 1) if v["sessions"] else 0,
        }
        for name, v in subject_map.items()
    ]

    # Productivity score (0-100)
    recent = [s for s in sessions if (today - s.date.date()).days <= 7]
    recent_minutes = sum(s.minutes for s in recent)
    recent_focus = sum(s.focus_rating for s in recent) / len(recent) if recent else 0
    recent_days = len(set(s.date.date() for s in recent))
    prod_score = min(100, round(
        min(40, (recent_minutes / 420) * 40)
        + (recent_focus / 5) * 40
        + (recent_days / 7) * 20
    ))

    # Neglected subjects (not studied in ≥3 days)
    neglected = [
        {"name": s.name, "daysSince": int(days_since(s.last_studied))}
        for s in subjects
        if s.last_studied and days_since(s.last_studied) >= 3
    ]

    return {
        "streak": streak,
        "totalMinutes": total_minutes,
        "avgFocus": avg_focus,
        "productivityScore": prod_score,
        "daily": daily,
        "subjects": subject_data,
        "neglected": neglected,
        "totalSessions": len(sessions),
    }


# ── Subjects CRUD ─────────────────────────────────────────────────────────────

@router.get("/api/subjects")
def get_subjects(user: User = Depends(require_user), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    return {
        "subjects": [
            {
                "id": s.id,
                "name": s.name,
                "difficulty": s.difficulty,
                "examDate": s.exam_date.isoformat() if s.exam_date else None,
                "totalMinutes": s.total_minutes,
                "avgFocus": s.avg_focus,
                "sessionCount": s.session_count,
                "struggling": s.struggling,
                "lastStudied": s.last_studied.isoformat() if s.last_studied else None,
            }
            for s in subjects
        ]
    }
