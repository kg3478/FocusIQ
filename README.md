# FocusIQ — AI-Powered Study Planner

FocusIQ is a premium, resume-ready AI SaaS application built for students. It generates AI study schedules utilizing the SM-2 spaced repetition algorithm, subject priority scoring, and NLP sentiment analysis on study notes.

## 🚀 Tech Stack (Stable & Production Ready)

**Frontend:**
- Next.js 14.2.x (App Router)
- React 18.2
- Tailwind CSS 3.4
- NextAuth v4
- Recharts

**Backend:**
- Python FastAPI
- SQLAlchemy + SQLite (PostgreSQL ready)
- `vaderSentiment` for NLP

---

## 🏃‍♂️ How to Run Locally

Open two terminal windows to run the frontend and backend simultaneously.

### 1. Start the Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 2. Start the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`.

*(Ensure you have a `.env.local` file in the `frontend/` folder based on `.env.example`)*

---

## 📦 Deployment Guide

### Deploying Backend to Render
1. Push this repository to GitHub.
2. Go to [Render.com](https://render.com/) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
7. Once deployed, note down your Render URL (e.g., `https://focusiq-api.onrender.com`).

### Deploying Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com/) and add a new project.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Add the following Environment Variables:
   - `NEXT_PUBLIC_API_URL` = *(Your Render backend URL)*
   - `NEXTAUTH_URL` = *(Your Vercel frontend URL, e.g., https://focusiq.vercel.app)*
   - `NEXTAUTH_SECRET` = *(Generate a random 32-char string)*
   - `GOOGLE_CLIENT_ID` = *(From Google Cloud Console)*
   - `GOOGLE_CLIENT_SECRET` = *(From Google Cloud Console)*
5. Click **Deploy**.

---

## 💼 Resume Bullet Points

- **Architected and launched an AI-driven study planner SaaS** using Next.js 14 and Python FastAPI, improving student learning efficiency through optimized scheduling algorithms.
- **Engineered a dynamic priority scoring engine** that dynamically weights exam urgency, past focus history, and subject difficulty to construct optimal daily learning paths.
- **Implemented SM-2 spaced repetition algorithms** into the backend architecture, adapting review intervals based on user feedback to maximize long-term retention.
- **Built a real-time analytics dashboard** with Recharts and Tailwind CSS, presenting productivity scores, study streaks, and focus metrics in a visually premium, high-conversion UI.
- **Integrated NLP sentiment analysis (VADER)** to automatically parse unstructured study notes and flag struggling subjects for immediate intervention.
- **Configured robust cross-origin authentication** using NextAuth v4 and JWTs, establishing a secure connection between the React frontend and the FastAPI microservice.
