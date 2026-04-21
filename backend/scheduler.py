"""
FocusIQ — AI Scheduling Engine (Python)

Implements:
  - Priority scoring formula
  - SM-2 spaced repetition algorithm
  - Daily schedule builder
  - Smart reminders generator
"""
from datetime import datetime, timedelta
from typing import List, Optional
import math


MS_PER_DAY = 86400  # seconds


def days_since(dt: Optional[datetime]) -> float:
    """Days elapsed since a past datetime. Returns 7.0 if None (never studied)."""
    if dt is None:
        return 7.0
    diff = datetime.utcnow() - dt
    return diff.total_seconds() / MS_PER_DAY


def days_until(dt: Optional[datetime]) -> Optional[float]:
    """Days until a future datetime. Returns None if no date."""
    if dt is None:
        return None
    diff = dt - datetime.utcnow()
    return diff.total_seconds() / MS_PER_DAY


def compute_priority(subject) -> float:
    """
    Compute priority score for a subject.

    priority = (days_since_last_study * 0.4)
             + (exam_nearness         * 0.3)
             + (low_focus_history     * 0.2)
             + (difficulty            * 0.1)

    Higher score = study this first.
    """
    # 1) Days since last study
    days_neglected = days_since(subject.last_studied)

    # 2) Exam nearness: 0-10 scale (urgent when ≤7 days)
    exam_nearness = 0.0
    due_days = days_until(subject.exam_date)
    if due_days is not None:
        if due_days <= 0:
            exam_nearness = 10.0
        else:
            exam_nearness = max(0.0, 10.0 - due_days * 0.5)

    # 3) Low focus penalty (inverted, 0-10 scale)
    avg_focus = subject.avg_focus or 3.0
    low_focus_history = max(0.0, (5 - avg_focus) / 5) * 10

    # 4) Difficulty (1-5 → 0-10)
    difficulty = ((subject.difficulty or 3) / 5) * 10

    score = (
        days_neglected * 0.4
        + exam_nearness * 0.3
        + low_focus_history * 0.2
        + difficulty * 0.1
    )

    return round(score, 1)


def build_reason(subject, priority: float) -> str:
    """Generate a human-readable explanation for why this subject was selected."""
    reasons = []

    elapsed = days_since(subject.last_studied)
    if subject.last_studied is None:
        reasons.append("Never studied yet")
    elif elapsed >= 3:
        reasons.append(f"Not studied for {int(elapsed)} day{'s' if elapsed != 1 else ''}")

    due_days = days_until(subject.exam_date)
    if due_days is not None and 0 <= due_days <= 7:
        d = math.ceil(due_days)
        reasons.append(f"Exam in {d} day{'s' if d != 1 else ''}")

    if subject.avg_focus and subject.avg_focus < 3:
        reasons.append("Low focus history")

    if subject.struggling:
        reasons.append("Marked as struggling")

    return reasons[0] if reasons else "Scheduled for today"


def is_due_for_review(subject) -> bool:
    """Check if SM-2 interval has expired."""
    if subject.next_review is None:
        return True
    return datetime.utcnow() >= subject.next_review


def build_schedule(subjects: list, daily_hours: float = 4.0) -> list:
    """
    Build today's prioritised study schedule.
    Returns list of dicts with priority, reason, recommendedMinutes, etc.
    """
    total_minutes = int(daily_hours * 60)

    scored = []
    for s in subjects:
        priority = compute_priority(s)
        scored.append({
            "id": s.id,
            "name": s.name,
            "difficulty": s.difficulty,
            "priority": priority,
            "reason": build_reason(s, priority),
            "isDueRevision": is_due_for_review(s),
            "examDate": s.exam_date.isoformat() if s.exam_date else None,
            "lastStudied": s.last_studied.isoformat() if s.last_studied else None,
            "avgFocus": s.avg_focus,
            "struggling": s.struggling,
        })

    # Sort descending by priority
    scored.sort(key=lambda x: x["priority"], reverse=True)

    # Distribute minutes proportionally (min 20, max 90 per subject)
    priority_sum = sum(s["priority"] for s in scored) or 1.0

    for s in scored:
        share = (s["priority"] / priority_sum) * total_minutes
        mins = min(90, max(20, round(share / 5) * 5))
        s["recommendedMinutes"] = mins

    return scored


def apply_sm2(subject, focus_score: int) -> dict:
    """
    Apply SM-2 algorithm after a study session.

    focus_score: 1-5 (user input)
    Returns updated interval, repetitions, ease_factor, next_review.
    """
    # Map focus 1-5 to SM-2 quality 0-5
    q = round(((focus_score - 1) / 4) * 5)

    interval = subject.interval or 1
    repetitions = subject.repetitions or 0
    ease_factor = subject.ease_factor or 2.5

    if q >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    ease_factor = max(1.3, ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    next_review = datetime.utcnow() + timedelta(days=interval)

    return {
        "interval": interval,
        "repetitions": repetitions,
        "ease_factor": round(ease_factor, 2),
        "next_review": next_review,
    }


def generate_reminders(subjects: list) -> list:
    """
    Generate smart reminders for neglected subjects and upcoming exams.
    """
    reminders = []

    for s in subjects:
        elapsed = days_since(s.last_studied)

        # Neglected subjects
        if s.last_studied is not None and elapsed >= 3:
            days_int = int(elapsed)
            reminders.append({
                "type": "neglected",
                "subject": s.name,
                "message": f"{s.name} not studied in {days_int} day{'s' if days_int != 1 else ''}",
                "severity": "high" if elapsed >= 7 else "medium",
            })

        # Upcoming exams
        if s.exam_date:
            due = days_until(s.exam_date)
            if due is not None and 0 <= due <= 7:
                d = math.ceil(due)
                reminders.append({
                    "type": "exam",
                    "subject": s.name,
                    "message": f"{s.name} exam in {d} day{'s' if d != 1 else ''}!",
                    "severity": "high" if d <= 2 else "medium",
                })

    # High severity first
    reminders.sort(key=lambda r: 0 if r["severity"] == "high" else 1)
    return reminders
