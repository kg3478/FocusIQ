# Product Manager Decision Journal: FocusIQ

**Author:** Kartik Garg, AI Product Manager  
**Date:** April 2026  
**Project:** FocusIQ — AI-Powered Study Planner

---

## Introduction
As an AI Product Manager, my role is to bridge the gap between user needs, technical feasibility, and business viability. Building FocusIQ required a series of strategic technical and product decisions. This journal documents the critical crossroads faced during development, the options considered, and the rationale behind the final choices to ensure FocusIQ remained scalable, user-centric, and portfolio-ready.

---

## Decision 1: Technical Architecture — Monolithic vs. Decoupled

### The Situation
When starting FocusIQ, we needed to establish the foundational architecture. We had to decide whether to build everything within a single Next.js monolith (using Next.js API routes for the backend) or decouple the frontend and backend.

### The Options
*   **Option A: Monolithic Next.js (Node.js backend)**
    *   *Pros:* Easier initial deployment (everything on Vercel), single codebase, shared Typescript types.
    *   *Cons:* Node.js is not the native language for Data Science or AI/ML. Scaling AI features later would require bridging Node with Python scripts, which is brittle and complex.
*   **Option B: Decoupled Architecture (Next.js Frontend + Python FastAPI Backend)**
    *   *Pros:* Python has the best ML/AI ecosystem (Pandas, Scikit-learn, PyTorch, NLTK/VADER). FastAPI is incredibly fast and built for microservices.
    *   *Cons:* Requires managing two deployments (Vercel and Render) and dealing with Cross-Origin Resource Sharing (CORS).

### The Decision & Rationale: Option B (Decoupled)
As an AI PM, anticipating future product growth is critical. While Option A would have been faster on Day 1, Option B is the right strategic choice for an *AI product*. By establishing a Python backend now, we integrated VADER NLP for sentiment analysis natively. If we later decide to introduce Large Language Models (LLMs) or complex recommendation engines, the Python infrastructure is already in place. It separates our presentation layer from our heavy-compute AI layer.

---

## Decision 2: Database Strategy — Local SQLite vs. Cloud PostgreSQL

### The Situation
For MVP validation, we needed a database to store user profiles, subjects, and study sessions.

### The Options
*   **Option A: SQLite (Local `.db` file)**
    *   *Pros:* Zero setup. Perfect for local development. Requires no external services or network calls.
    *   *Cons:* When deployed to a free serverless tier like Render, the disk is ephemeral. Every time the server spins down, the `.db` file is wiped.
*   **Option B: Cloud PostgreSQL (Supabase)**
    *   *Pros:* Persistent storage, enterprise-grade, provides a dashboard to view user metrics and data.
    *   *Cons:* Requires setting up an external service, managing connection pooling, and dealing with IPv4/IPv6 compatibility.

### The Decision & Rationale: Option B (Cloud PostgreSQL via Supabase)
We started with Option A for rapid prototyping. However, for the production launch, we migrated to Option B. **Why? Because data is the lifeblood of a Product Manager.** I cannot measure retention, Daily Active Users (DAU), or AI schedule adherence if the database wipes every 15 minutes. Using Supabase provides persistent, reliable data storage, allowing me to track KPIs and user metrics accurately to inform future product iterations.

---

## Decision 3: The AI Engine — LLM vs. Deterministic Algorithm + NLP

### The Situation
FocusIQ's core value proposition is telling students exactly what to study. We needed an "AI Engine" to generate this schedule.

### The Options
*   **Option A: Large Language Model (OpenAI API)**
    *   *Pros:* High "wow" factor. Can output highly conversational schedules.
    *   *Cons:* Expensive per call, slow API latency (3-5 seconds), and prone to hallucinations. An LLM might randomly suggest a 4-hour study block for a minor subject.
*   **Option B: Deterministic Priority Algorithm + Lexicon NLP (SM-2 & VADER)**
    *   *Pros:* 100% predictable, lightning fast, costs $0 to run. Uses proven cognitive science (SuperMemo-2 spaced repetition algorithm) combined with VADER sentiment analysis on session notes to detect "struggle."
    *   *Cons:* Less conversational, requires building the mathematical weights from scratch.

### The Decision & Rationale: Option B (Deterministic + NLP)
For a utility tool like a study scheduler, reliability and trust are paramount. If a student sees a hallucinated or illogical schedule, they will churn immediately. By building a proprietary mathematical priority engine (factoring in exam dates, neglect days, and difficulty), we guarantee a logical schedule. We injected "AI" strategically by using VADER NLP to read the student's study notes and assign a sentiment score. If the NLP detects negative sentiment (e.g., "I really struggled with arrays today"), it automatically bumps the subject's priority. This is a PM masterclass in applying the *right* level of AI for the problem, rather than just slapping a GPT wrapper on it.

---

## Decision 4: User Onboarding — Blank State vs. Auto-Seeding

### The Situation
When a brand new user logs into FocusIQ, their dashboard is completely empty because they haven't added subjects or logged sessions yet.

### The Options
*   **Option A: Blank State with Tooltips**
    *   *Pros:* Standard SaaS approach. Forces the user to configure their own exact setup.
    *   *Cons:* High cognitive load. Users might experience "blank canvas paralysis" and abandon the app before seeing its value.
*   **Option B: Auto-Seeding Demo Data**
    *   *Pros:* Instant "Aha!" moment. The dashboard looks rich, colorful, and active the second they log in.
    *   *Cons:* Requires backend logic to inject fake data on first login.

### The Decision & Rationale: Option B (Auto-Seeding Demo Data)
In consumer SaaS, time-to-value (TTV) must be under 30 seconds. I decided to intercept the backend `/api/user/sync` route. If a user is new, the system silently creates four realistic subjects (Data Structures, DBMS, OS, Computer Networks) and populates the dashboard. This allows the user to immediately see the UI, interact with the study cards, and understand the product's value proposition without having to do any work themselves. They can always delete them later, but the immediate engagement drastically improves activation rates.
