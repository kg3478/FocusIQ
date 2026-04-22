# Product Requirements Document (PRD): FocusIQ

**Product:** FocusIQ  
**Target Release:** v1.0 (MVP)  
**Author:** Kartik Garg, AI Product Manager  
**Date:** April 2026

---

## 1. Executive Summary
FocusIQ is an AI-powered study planner designed for college and high school students. It eliminates the cognitive load of planning by generating a daily, optimized study schedule. Leveraging spaced repetition (SM-2) and NLP sentiment analysis, FocusIQ ensures students study the right subjects at the exact right time, minimizing burnout and maximizing retention.

## 2. Problem Statement
Students waste an average of 30-45 minutes per study session simply deciding *what* to study. Traditional planners are static and require manual upkeep. When a student falls behind, the planner becomes obsolete, leading to anxiety and abandonment. Students need a dynamic tool that adapts to their performance, upcoming exams, and historical focus levels.

## 3. Target Audience
*   **Primary:** Undergraduate college students (specifically STEM and pre-med) managing 4-6 heavy coursework subjects.
*   **Secondary:** High school students preparing for standardized tests (SAT/AP).

## 4. Key Performance Indicators (KPIs)
*   **Activation Rate:** % of users who log their first study session within 24 hours of signup.
*   **Session Log Rate:** Average number of study sessions logged per user per week.
*   **Retention (W1/W4):** % of users returning in Week 1 and Week 4.
*   **Schedule Adherence:** % of suggested subjects completed daily by the user.

---

## 5. Core Features & Requirements

### 5.1. AI Priority Engine (P0)
*   **Description:** The core algorithm that determines the daily study schedule.
*   **Logic:** Scores every subject out of 100 based on four weighted signals:
    1.  **Neglect Penalty (40%):** Days since the subject was last studied.
    2.  **Urgency (30%):** Days remaining until the target exam.
    3.  **Struggle Indicator (20%):** Inverse of the historical focus score.
    4.  **Base Difficulty (10%):** User-defined difficulty level (1-5).
*   **Requirement:** The engine must rank subjects and allocate time blocks dynamically based on the user's daily availability (e.g., 4 hours total).

### 5.2. Spaced Repetition Integration (P0)
*   **Description:** Adaptive review scheduling.
*   **Logic:** Integrates the SuperMemo-2 (SM-2) algorithm. When a user logs a session, they provide a focus rating (1-5).
    *   Rating 4-5 (Easy): Review interval increases.
    *   Rating 3 (Medium): Review interval stays flat or slightly increases.
    *   Rating 1-2 (Hard): Review interval resets (study again tomorrow).
*   **Requirement:** Must track the `next_review_date` per subject.

### 5.3. NLP Sentiment Analysis on Notes (P1)
*   **Description:** Extracts implicit feedback from user session notes.
*   **Logic:** Uses VADER Lexicon NLP.
*   **Requirement:** When a user logs a session and writes notes (e.g., "I am completely lost on Binary Trees"), the backend must run sentiment analysis. Negative sentiment automatically flags the subject as a "Weak Subject" and boosts its priority score for the next 3 days, regardless of the explicit focus rating.

### 5.4. User Dashboard & Analytics (P1)
*   **Description:** Visual feedback loop to keep users motivated.
*   **Requirement:** Must include:
    *   Today's AI Plan (List of subjects to study).
    *   Productivity Score (Out of 100, based on recent adherence).
    *   7-Day Streak & Study Time Chart (Bar chart).
    *   Focus Heatmap (Line chart showing focus quality over time).
    *   Alerts widget for neglected subjects.

### 5.5. Authentication & Onboarding (P0)
*   **Description:** Frictionless entry.
*   **Requirement:** Google Sign-In via OAuth. Upon first login, auto-seed the database with 4 demo subjects so the user immediately experiences a rich dashboard ("Aha!" moment).

---

## 6. Technical Architecture & Constraints
*   **Frontend:** Next.js 14, React 18, Tailwind CSS. Must be fully responsive (mobile-first).
*   **Backend:** Python 3.11+ FastAPI. Decoupled architecture to support future AI/ML workloads.
*   **Database:** PostgreSQL (Supabase) for persistent, scalable storage.
*   **Constraints:** API response times for the scheduler must be under 800ms to ensure a snappy UX.

---

## 7. Future Roadmap (v2.0+)
*   **Notion/Google Calendar Integration:** Sync exams and pull syllabus topics automatically.
*   **LLM "Tutor" Integration:** Introduce an OpenAI-powered chat that generates practice questions based on the user's session notes.
*   **Social/Leaderboards:** Allow students to share study streaks with friends for accountability.
