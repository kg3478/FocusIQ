# 🚀 FocusIQ — Deployment, Infrastructure & DevOps Guide

**Author:** Kartik Garg, AI Product Manager  
**Platform Version:** v2.0.0  
**Target Environments:** Production (Vercel + Render + Supabase) & Local Development  

---

## 1. High-Level Infrastructure Topology

FocusIQ employs an edge-distributed cloud topology:

```
[ User Browser ]
       │
       ▼ (HTTPS)
┌─────────────────────────────────┐
│     Vercel Edge Network         │
│   - Next.js 14 App Router       │
│   - Global CDN Cache            │
│   - NextAuth JWT Token Session  │
└────────────────┬────────────────┘
                 │
                 ▼ (REST / JSON over HTTPS)
┌─────────────────────────────────┐
│     Render Cloud Container      │
│   - FastAPI (Python 3.11)       │
│   - Uvicorn ASGI Server         │
│   - AI Scheduler + VADER NLP    │
└────────────────┬────────────────┘
                 │
                 ▼ (PostgreSQL Wire Protocol with SSL)
┌─────────────────────────────────┐
│    Supabase Managed Database    │
│   - PostgreSQL 15 Relational DB │
│   - Built-in Connection Pooling │
└─────────────────────────────────┘
```

---

## 2. Production Cloud Setup Runbook

### Step 1: Database Provisioning (Supabase PostgreSQL)
1. Navigate to [Supabase](https://supabase.com) and create a new project named `FocusIQ-Prod`.
2. Select your closest AWS region (e.g., `ap-south-1` for Mumbai or `us-east-1`).
3. Note your database password securely.
4. Under **Project Settings $\rightarrow$ Database**, retrieve your connection string:
   * **URI Format:**  
     `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   * *Note:* If running into IPv6 resolution issues on Render, switch to the Supabase connection pooler URI (Port `6543`).

---

### Step 2: Backend Microservice Deployment (Render)
1. Sign in to [Render](https://render.com) and click **New $\rightarrow$ Web Service**.
2. Connect your GitHub repository: `https://github.com/kg3478/FocusIQ`.
3. Configure the service settings:
   * **Name:** `focusiq-api`
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Configure **Environment Variables**:
   * `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   * `FRONTEND_URL`: `https://focus-iq-two.vercel.app`
   * `ENVIRONMENT`: `production`
   * `PYTHON_VERSION`: `3.11.8`
5. Configure **Health Check Path**: `/health`
6. Deploy the service and verify it responds with HTTP 200 at `https://focusiq-api.onrender.com/health`.

---

### Step 3: Frontend Web Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com) and click **Add New $\rightarrow$ Project**.
2. Select your `FocusIQ` repository.
3. Configure project settings:
   * **Root Directory:** Click "Edit" and choose `frontend`.
   * **Framework Preset:** `Next.js` (automatically detected).
4. Configure **Environment Variables**:
   * `NEXT_PUBLIC_API_URL`: `https://focusiq-api.onrender.com`
   * `NEXTAUTH_URL`: `https://focus-iq-two.vercel.app`
   * `NEXTAUTH_SECRET`: `[GENERATE_A_32_CHAR_RANDOM_SECRET]` (e.g., `openssl rand -base64 32`)
   * `GOOGLE_CLIENT_ID`: `[YOUR_GOOGLE_OAUTH_CLIENT_ID]` (Optional: email login works independently)
   * `GOOGLE_CLIENT_SECRET`: `[YOUR_GOOGLE_OAUTH_CLIENT_SECRET]` (Optional)
5. Click **Deploy**. Vercel will build the Next.js bundle and publish to edge edge locations.

---

## 3. Local Development Quickstart

You need **Node.js 18+** and **Python 3.10+** installed locally.

### 1. Clone the Repository
```bash
git clone https://github.com/kg3478/FocusIQ.git
cd FocusIQ
```

### 2. Configure & Launch Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create local environment config
cat <<EOF > .env
DATABASE_URL=sqlite:///./focusiq.db
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
EOF

# Start development server
uvicorn main:app --reload --port 8000
```
* Backend API: `http://localhost:8000`
* Swagger OpenAPI Docs: `http://localhost:8000/docs`

### 3. Configure & Launch Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create local environment config
cat <<EOF > .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-development-secret-key-focusiq-32char
EOF

# Start Next.js development server
npm run dev
```
* Web App: `http://localhost:3000`

---

## 4. Environment Variables Master Matrix

### Frontend (`frontend/.env.local`)
| Variable | Required | Description | Example |
|:---|:---:|:---|:---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Root endpoint of the FastAPI backend | `https://focusiq-api.onrender.com` |
| `NEXTAUTH_URL` | **Yes** | Canonical URL of the frontend | `https://focus-iq-two.vercel.app` |
| `NEXTAUTH_SECRET` | **Yes** | Cryptographic key for signing JWTs | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud OAuth Client ID | `123456...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud OAuth Client Secret | `GOCSPX-...` |

### Backend (`backend/.env`)
| Variable | Required | Description | Example |
|:---|:---:|:---|:---|
| `DATABASE_URL` | **Yes** | Database connection string | `postgresql://...` or `sqlite:///./focusiq.db` |
| `FRONTEND_URL` | **Yes** | Allowed CORS origin | `https://focus-iq-two.vercel.app` |
| `ENVIRONMENT` | No | Environment tag (`development` / `production`) | `production` |
| `PORT` | No | Port for Uvicorn ASGI server | `8000` |

---

## 5. DevOps Runbook & Troubleshooting

### Issue 1: CORS Error in Browser Console
* **Symptom:** `Access to fetch at ... has been blocked by CORS policy`
* **Root Cause:** Backend `FRONTEND_URL` does not match the requesting client domain.
* **Fix:** Update `FRONTEND_URL` in Render environment variables to the exact Vercel production domain without trailing slash (`https://focus-iq-two.vercel.app`).

### Issue 2: Supabase Connection Drops
* **Symptom:** `OperationalError: SSL connection has been closed unexpectedly`
* **Root Cause:** Cloud serverless proxies drop idle connections after inactivity.
* **Fix:** Already handled in `backend/database.py` via `pool_pre_ping=True` and `pool_recycle=300`. If using Supabase free tier with IPv6, connect via Supabase Connection Pooler (`port 6543`).

### Issue 3: NextAuth Callback URL Error
* **Symptom:** Google OAuth returns `redirect_uri_mismatch`.
* **Fix:** Ensure `https://focus-iq-two.vercel.app/api/auth/callback/google` is added to Authorized Redirect URIs in Google Cloud Console.

### Issue 4: Render Free Tier Cold Starts
* **Symptom:** First request takes 30–50 seconds after inactivity.
* **Mitigation:** Use a free uptime monitor (e.g., UptimeRobot, Cron-Job.org) pinging `https://focusiq-api.onrender.com/health` every 10 minutes to keep the container awake.
