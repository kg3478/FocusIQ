# 🔌 FocusIQ — REST API Specification & Data Dictionary

**Author:** Kartik Garg, AI Product Manager  
**API Version:** `2.0.0`  
**OpenAPI Docs:** `https://focusiq-api.onrender.com/docs`  
**Base URL (Production):** `https://focusiq-api.onrender.com`  
**Base URL (Local Dev):** `http://localhost:8000`  

---

## 1. Authentication & Request Protocol

FocusIQ employs a **stateless, header-propagated authentication model**. After the client authenticates via NextAuth.js (Google OAuth or Credentials), every outgoing HTTP request to the FastAPI backend includes the verified user email:

```http
Content-Type: application/json
X-User-Email: student@example.com
```

* **Security Dependency (`require_user`):** The backend inspects `X-User-Email`. If absent, the server immediately returns `401 Unauthorized`.
* **Zero-Friction User Provisioning:** If a valid email is received but does not exist in the database, the backend automatically provisions a user profile on the fly.

---

## 2. Standard Error Handling

All unhandled exceptions are intercepted by global middleware and returned in uniform JSON format:

```json
{
  "detail": "Descriptive error message"
}
```

| HTTP Status | Meaning | Typical Trigger |
|:---|:---|:---|
| **`200 OK`** | Success | Request processed and payload returned |
| **`401 Unauthorized`** | Missing Identity | Request missing `X-User-Email` header |
| **`404 Not Found`** | Resource Missing | Invalid `subjectId` or resource does not belong to user |
| **`422 Unprocessable Entity`** | Validation Error | Pydantic payload type mismatch or missing required field |
| **`500 Internal Server Error`** | Server Fault | Unhandled exception trapped by global middleware |

---

## 3. Endpoints Reference

### 3.1. Auth & User Synchronization

#### `POST /api/user/sync`
Synchronizes user identity between NextAuth and the backend database. Silently seeds four default STEM courses for new users to eliminate blank-state paralysis.

* **Request Headers:** None (email is passed in body)
* **Request Body:**
```json
{
  "email": "student@example.com",
  "name": "Arjun Sharma",
  "image": "https://lh3.googleusercontent.com/a/avatar.jpg"
}
```
* **Response Body (`200 OK`):**
```json
{
  "id": 1,
  "email": "student@example.com",
  "name": "Arjun Sharma",
  "onboarded": true,
  "plan": "free",
  "dailyHours": 4.0
}
```

---

### 3.2. Onboarding & Curriculum Setup

#### `POST /api/onboarding`
Replaces existing subjects and persists student's updated course list, difficulty ratings, exam dates, and daily study capacity.

* **Request Headers:** `X-User-Email: student@example.com`
* **Request Body:**
```json
{
  "subjects": [
    {
      "name": "Data Structures & Algorithms",
      "difficulty": 5,
      "examDate": "2026-05-15"
    },
    {
      "name": "Database Management Systems",
      "difficulty": 4,
      "examDate": "2026-05-20"
    }
  ],
  "dailyHours": 4.0,
  "preferredTime": "morning"
}
```
* **Response Body (`200 OK`):**
```json
{
  "success": true,
  "message": "Onboarding complete"
}
```

---

### 3.3. Daily AI Schedule & Alerts

#### `GET /api/schedule`
Executes the AI priority solver and generates today's ranked schedule, proportional time blocks, and active smart reminders.

* **Request Headers:** `X-User-Email: student@example.com`
* **Response Body (`200 OK`):**
```json
{
  "schedule": [
    {
      "id": 1,
      "name": "Data Structures & Algorithms",
      "difficulty": 5,
      "priority": 8.4,
      "reason": "Exam in 3 days",
      "isDueRevision": true,
      "examDate": "2026-05-15T00:00:00",
      "lastStudied": "2026-05-10T14:30:00",
      "avgFocus": 4.2,
      "struggling": false,
      "recommendedMinutes": 60
    },
    {
      "id": 2,
      "name": "Database Management Systems",
      "difficulty": 4,
      "priority": 5.1,
      "reason": "Not studied for 4 days",
      "isDueRevision": false,
      "examDate": "2026-05-20T00:00:00",
      "lastStudied": "2026-05-08T11:00:00",
      "avgFocus": 3.8,
      "struggling": true,
      "recommendedMinutes": 45
    }
  ],
  "reminders": [
    {
      "type": "exam",
      "subject": "Data Structures & Algorithms",
      "message": "Data Structures & Algorithms exam in 3 days!",
      "severity": "high"
    },
    {
      "type": "neglected",
      "subject": "Database Management Systems",
      "message": "Database Management Systems not studied in 4 days",
      "severity": "medium"
    }
  ]
}
```

---

### 3.4. Study Session Logging

#### `POST /api/session`
Logs a completed study session, executes VADER NLP struggle analysis on notes, updates running subject statistics, and applies the SuperMemo-2 (SM-2) algorithm.

* **Request Headers:** `X-User-Email: student@example.com`
* **Request Body:**
```json
{
  "subjectId": 1,
  "minutes": 60,
  "focusRating": 4,
  "note": "Understood AVL trees, but struggled slightly with double rotations."
}
```
* **Response Body (`200 OK`):**
```json
{
  "success": true,
  "sessionId": 42,
  "sentiment": {
    "label": "negative",
    "compound": -0.226,
    "struggling": true
  },
  "sm2": {
    "interval": 6,
    "repetitions": 1,
    "ease_factor": 2.5,
    "next_review": "2026-05-18T21:00:00"
  }
}
```

---

### 3.5. Session History

#### `GET /api/sessions`
Retrieves chronological history of logged sessions for the authenticated student.

* **Request Headers:** `X-User-Email: student@example.com`
* **Query Parameters:** `limit` (int, default: 100)
* **Response Body (`200 OK`):**
```json
{
  "sessions": [
    {
      "id": 42,
      "subjectId": 1,
      "subjectName": "Data Structures & Algorithms",
      "minutes": 60,
      "focusRating": 4,
      "note": "Understood AVL trees, but struggled slightly with double rotations.",
      "sentiment": "negative",
      "date": "2026-05-12T15:20:00"
    }
  ]
}
```

---

### 3.6. Analytics & Performance

#### `GET /api/analytics`
Returns aggregated analytics including 7-day study volume, focus trend line, subject split, current streak, and composite Productivity Score.

* **Request Headers:** `X-User-Email: student@example.com`
* **Response Body (`200 OK`):**
```json
{
  "streak": 5,
  "totalMinutes": 480,
  "avgFocus": 4.1,
  "productivityScore": 84,
  "daily": [
    { "label": "Mon 6", "minutes": 60, "focus": 4.0, "sessions": 1 },
    { "label": "Tue 7", "minutes": 90, "focus": 4.5, "sessions": 2 },
    { "label": "Wed 8", "minutes": 45, "focus": 3.0, "sessions": 1 },
    { "label": "Thu 9", "minutes": 120, "focus": 4.2, "sessions": 2 },
    { "label": "Fri 10", "minutes": 75, "focus": 4.0, "sessions": 1 },
    { "label": "Sat 11", "minutes": 90, "focus": 5.0, "sessions": 2 },
    { "label": "Sun 12", "minutes": 0, "focus": 0.0, "sessions": 0 }
  ],
  "subjects": [
    { "name": "Data Structures & Algorithms", "minutes": 240, "sessions": 4, "avgFocus": 4.3 },
    { "name": "Database Management Systems", "minutes": 150, "sessions": 3, "avgFocus": 3.7 },
    { "name": "Operating Systems", "minutes": 90, "sessions": 2, "avgFocus": 4.0 }
  ],
  "neglected": [
    { "name": "Operating Systems", "daysSince": 4 }
  ],
  "totalSessions": 9
}
```

---

### 3.7. Subjects Management

#### `GET /api/subjects`
Fetches all active registered courses and their cumulative SM-2 retention metrics.

* **Request Headers:** `X-User-Email: student@example.com`
* **Response Body (`200 OK`):**
```json
{
  "subjects": [
    {
      "id": 1,
      "name": "Data Structures & Algorithms",
      "difficulty": 5,
      "examDate": "2026-05-15T00:00:00",
      "totalMinutes": 240,
      "avgFocus": 4.3,
      "sessionCount": 4,
      "struggling": false,
      "lastStudied": "2026-05-12T15:20:00"
    }
  ]
}
```

---

### 3.8. System Health & Metadata

#### `GET /health`
* **Response Body (`200 OK`):**
```json
{
  "status": "healthy",
  "service": "focusiq-backend",
  "environment": "production"
}
```

#### `GET /`
* **Response Body (`200 OK`):**
```json
{
  "status": "ok",
  "app": "FocusIQ API",
  "version": "2.0.0"
}
```

---

## 4. Sample cURL Test Commands

### 1. Test Schedule Retrieval:
```bash
curl -X GET "https://focusiq-api.onrender.com/api/schedule" \
  -H "X-User-Email: test@focusiq.com" \
  -H "Content-Type: application/json"
```

### 2. Test Session Logging with Struggle Notes:
```bash
curl -X POST "https://focusiq-api.onrender.com/api/session" \
  -H "X-User-Email: test@focusiq.com" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": 1,
    "minutes": 45,
    "focusRating": 2,
    "note": "I got completely lost and confused with pointer arithmetic."
  }'
```
