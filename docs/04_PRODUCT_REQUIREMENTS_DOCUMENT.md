# 📋 Product Requirements Document (PRD): FocusIQ

**Product:** FocusIQ — AI-Powered Study Optimizer  
**Document Version:** v2.0  
**Author:** Kartik Garg, AI Product Manager  
**Target Release:** v1.0 (MVP) & v2.0 (Intelligent Retention)  
**Status:** In Production  

---

## 1. Executive Summary

FocusIQ is an AI-powered study optimization platform engineered for college and high-school students managing heavy academic coursework and high-stakes exams. 

Most study planning tools fail because they are **static, manual, and lack a closed behavioral feedback loop**. Students waste 40–60% of their study time agonizing over *what* to study, or default to studying subjects they are already comfortable with while neglecting high-risk courses. 

FocusIQ eliminates planning paralysis by dynamically generating an optimized daily study schedule. Combining **SuperMemo-2 (SM-2) Spaced Repetition** with **VADER Natural Language Processing (NLP)**, FocusIQ ensures students review the right subject at the exact moment cognitive retention begins to decay.

---

## 2. Problem Statement & Root Cause Analysis

### 2.1. The Student Productivity Dilemma
* Students waste an average of **30–45 minutes per session** deciding what to study, shuffling between disconnected tools (Notion, Google Calendar, WhatsApp groups, physical notebooks).
* Static schedules break the moment life happens: missing one planned session cascades into guilt, schedule obsolescence, and product abandonment.
* Students suffer from **cognitive bias**: they spend 70% of their study time on subjects they already excel at, ignoring difficult courses until 48 hours before an exam.

### 2.2. Root Cause Analysis (5 Whys)
1. **Why do students underperform in exams?**  
   $\rightarrow$ They neglect critical, high-difficulty subjects until the final 48 hours.
2. **Why are critical subjects neglected?**  
   $\rightarrow$ No tool alerts them when a subject hasn't been reviewed in multiple days.
3. **Why don't students track subject recency manually?**  
   $\rightarrow$ Manual tracking requires high administrative overhead; tracking apps feel like chores.
4. **Why do tracking apps feel like chores?**  
   $\rightarrow$ They require manual data entry without providing actionable recommendations in return.
5. **Core Root Cause:**  
   $\rightarrow$ **Existing tools lack a closed behavioral feedback loop.** They record history but do not adapt future recommendations based on performance.

---

## 3. Competitive Analysis & Market Opportunity

| Product | Strengths | Critical Weaknesses | FocusIQ Moat |
|:---|:---|:---|:---|
| **Google Calendar** | Ubiquitous, free, integrates everywhere | Completely static; doesn't know what you studied or if you retained it | **Dynamic Adaptation:** Reschedules based on session outcomes |
| **Notion** | Infinite customization, database views | High setup friction; requires manual upkeep; no intelligence | **Zero Setup:** Auto-seeds curriculum in < 30 seconds |
| **Anki** | Proven SM-2 spaced repetition | Micro-flashcard level only; cannot plan high-level course study hours | **Macro-Level Spaced Repetition:** Plans entire study blocks |
| **Forest** | Gamified Pomodoro timer | Timer only; completely agnostic to curriculum urgency or exam dates | **Context-Aware:** Allocates time based on exam proximity |
| **FocusIQ** | **Adaptive AI scheduler + Spaced Repetition + NLP struggle detection + Instant TTV** | Focused on planning (no native flashcard creation) | **Closed Feedback Loop:** Learns from session quality and struggle notes |

---

## 4. User Personas & Jobs To Be Done (JTBD)

### Persona 1: Arjun (The Placement Aspirant — Primary)
* **Profile:** 3rd Year CSE Undergraduate, preparing for campus placements and semester finals.
* **Coursework:** 6 Courses (Data Structures, DBMS, Operating Systems, Computer Networks, Aptitude, System Design).
* **Pain Point:** Spends all day solving LeetCode problems; forgets theory subjects until the weekend before midterms.
* **Goal:** Maximize GPA and crack tech interviews without pulling all-nighters.

### Persona 2: Priya (The Upskilling Professional — Secondary)
* **Profile:** Self-taught developer studying for cloud engineering certifications.
* **Coursework:** 3 intensive certification paths (AWS Solutions Architect, Kubernetes, Golang).
* **Pain Point:** Struggles with retention across multi-month study windows; lacks accountability.
* **Goal:** Retain technical architecture patterns systematically through spaced repetition.

### Jobs To Be Done (JTBD) Framework:
> *"When I sit down at my desk to study, I want an intelligent system to tell me exactly which course to study and for how long, so that I don't waste energy deciding, never neglect a weak subject, and feel fully prepared on exam day."*

---

## 5. Success Metrics & Product KPIs

```
                                 ┌──────────────────────────────┐
                                 │      NORTH STAR METRIC       │
                                 │    Subject Coverage Rate     │
                                 │            (>75%)            │
                                 └──────────────┬───────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
  ┌─────────────────────────────┐                               ┌─────────────────────────────┐
  │     Product Experience      │                               │      AI Model Quality       │
  │ - Activation Rate (>60%)    │                               │ - Schedule Accuracy (>75%)  │
  │ - Schedule Acceptance (>70%)│                               │ - Sentiment Correlation     │
  │ - DAU/WAU Ratio (>0.4)      │                               │ - SM-2 Calibration Rate     │
  │ - Logging Time (<30s)       │                               │ - Cold Start Latency (<25s) │
  └─────────────────────────────┘                               └─────────────────────────────┘
```

### 5.1. Product KPIs
* **North Star Metric — Subject Coverage Rate (>75%):** % of registered subjects studied at least once per 7-day rolling window per active user.
* **Activation Rate (>60%):** % of signups who log their first study session within 24 hours.
* **Schedule Acceptance Rate (>70%):** % of AI-recommended subjects accepted and studied without manual override.
* **Stickiness (DAU/WAU > 0.4):** Ratio of daily active students to weekly active students.
* **Retention (Week-2 > 45%, Week-4 > 30%):** Cohort retention of activated students.
* **Session Logging Friction (<30s):** Median time required to complete the study session log drawer.
* **Net Promoter Score (NPS > 40):** Measured via in-app surveys at 14 days post-signup.

### 5.2. AI-Specific Quality Metrics
* **Schedule Precision:** % of suggested study durations matching actual completed duration within $\pm 15\%$.
* **Sentiment-Focus Correlation:** Statistical correlation between VADER sentiment compound score and user self-reported focus score ($r > 0.65$).
* **SM-2 Calibration Precision:** % of SM-2 review dates resulting in a subsequent focus score of $\ge 3/5$.
* **Cold-Start Time-to-Value:** Latency from account creation to first rendered AI schedule ($< 25\text{ seconds}$).

---

## 6. Functional Requirements & Feature Matrix

### F1: Frictionless Auth & Auto-Seeding (Priority: P0)
* **Description:** Unified login via Google SSO and credentials.
* **Requirement:** On first login, `/api/user/sync` must silently seed four default courses (Data Structures, DBMS, Operating Systems, Computer Networks) with difficulty ratings and a default 4.0-hour daily budget.
* **Acceptance Criteria:** Student lands on a populated dashboard with zero modal blocking screens.

### F2: Dynamic AI Daily Planner (Priority: P0)
* **Description:** Daily ranked study schedule based on the 4-factor scoring model.
* **Requirement:** Score every course based on Neglect (40%), Exam Proximity (30%), Low Focus History (20%), and Difficulty (10%).
* **Acceptance Criteria:**
  * Allocate 20m–90m study blocks in 5-minute increments.
  * Render priority status pills (High, Medium, Low) and natural-language context reasons.

### F3: 1-Tap Session Logger with VADER NLP (Priority: P0)
* **Description:** Rapid session logging drawer embedded directly within each study card.
* **Requirement:** Captures minutes studied, 1–5 focus rating slider, and optional reflection notes.
* **Acceptance Criteria:**
  * Backend executes VADER NLP sentiment analysis on notes.
  * Detects struggle keywords (`confused`, `stuck`, `lost`, `cant understand`, `overwhelmed`).
  * Automatically tags subject with `struggling = True` on negative sentiment.

### F4: Spaced Repetition (SM-2) Tracking (Priority: P0)
* **Description:** Adaptive memory retention intervals based on SuperMemo-2.
* **Requirement:** Calculates new Easiness Factor ($EF$) and interval ($I$) on each session log.
* **Acceptance Criteria:**
  * Focus rating $\ge 4$: Expands review interval ($1 \rightarrow 6 \rightarrow I \times EF$).
  * Focus rating $\le 2$: Resets interval to 1 day.
  * Renders `🔄 Review Due` pill when current timestamp exceeds `next_review`.

### F5: Analytics & Productivity Dashboard (Priority: P1)
* **Description:** Real-time visual feedback tracking consistency and performance.
* **Requirement:**
  * **Productivity Score (0–100):** Composite metric of volume, focus, and active days.
  * **Streak Counter:** Active consecutive days studied.
  * **Interactive Charts:** 7-day study minutes (Bar), focus quality heatmap (Line), and subject split (Donut).

### F6: Proactive Neglect & Exam Alerts (Priority: P1)
* **Description:** Automated threat detection for neglected subjects and upcoming exams.
* **Requirement:**
  * Neglect Alert: Triggered when course has not been studied in $\ge 3$ days (High severity at $\ge 7$ days).
  * Exam Alert: Triggered when exam date is within 7 days (High severity at $\le 2$ days).

### F7: Peer Benchmarking via Collaborative Filtering (Priority: P2 — Phase 2)
* **Description:** Machine learning recommendation comparing study patterns across student cohorts.
* **Requirement:** Recommend optimal study block durations and time-of-day slots based on similar user retention outcomes.

---

## 7. Product Visual Preview

The FocusIQ user interface is designed for high-aesthetic clarity and minimal cognitive load:

![FocusIQ Dashboard Preview](./images/dashboard_preview.jpg)

---

## 8. Non-Goals & Boundaries

To preserve product focus, the following items are explicitly **out of scope**:
* ❌ **Not a Content or LMS Platform:** FocusIQ does not host textbooks, video lectures, or study materials.
* ❌ **Not a Flashcard Generator:** FocusIQ manages macro-level subject study blocks, not micro-flashcards.
* ❌ **Not a Social Feed:** FocusIQ does not include direct messaging, public profiles, or distraction-heavy feeds.

---

## 9. Technical Constraints & SLA Requirements

* **API Response Time:** Scheduler P95 latency must be under **800ms**.
* **Zero Data Loss:** All study sessions and retention intervals must persist in cloud storage (Supabase PostgreSQL).
* **Mobile Responsiveness:** All UI layouts must be 100% functional on mobile screen widths (375px+).
* **Zero Institutional Dependency:** Must operate without requiring university email domains or single-tenant LMS integrations.

---

## 10. Phased Roadmap

| Phase | Duration | Core Deliverables | Success Gate |
|:---|:---|:---|:---|
| **Phase 1: Discovery** | Weeks 1–2 | 10 student interviews, competitive matrix, user personas, PRD definition | Problem validated across 10 interviews |
| **Phase 2: MVP Core** | Weeks 3–4 | Next.js frontend, FastAPI backend, SQLite setup, basic 4-factor scheduler | Working core loop: Plan $\rightarrow$ Log $\rightarrow$ View |
| **Phase 3: AI Intelligence** | Weeks 5–6 | VADER NLP sentiment engine, SM-2 integration, Supabase migration | 100% test coverage on scheduler |
| **Phase 4: Beta Validation** | Weeks 7–8 | 15-student pilot cohort, telemetry tracking, logging UX iteration | Schedule acceptance rate > 70% |
| **Phase 5: V2 Intelligence** | Week 9+ | Collaborative filtering, calendar sync, automated syllabus parsing | V2 PRD & model specifications |
