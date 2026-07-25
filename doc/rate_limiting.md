# Rate Limiting Setup & Strategy in Parakh

This document details the rate-limiting architecture, tier classifications, environment configurations, and frontend error handling for **Project Parakh**.

---

## 1. Executive Summary & Design Rationale

In a modern web application like Parakh (React frontend + Express orchestrator + Supabase + Gemini AI Service), endpoints have vastly different cost profiles and security risks:

- **Authentication Endpoints** (`/login`, `/register`) carry security risks (brute-force password guessing, account enumeration).
- **AI & File Upload Endpoints** (`/upload-paper`, `/generate-rubric`, `/upload-answers`) carry financial and resource costs (Gemini API quota consumption, multimodal PDF parsing overhead).
- **Read & Dashboard Endpoints** (`/exams/list`, `/evaluations/paper/:id`) are light, fast, and frequently fetched during UI navigation.

### Why Blanket Global Rate Limiting Was Removed
Previously, a single global rate limiter (`globalLimiter`) was bound to all `/api/*` routes with a limit of 100 requests per 15 minutes. 

Because the React frontend loads dashboard metrics by executing queries for exam papers and their evaluations, normal user browsing rapidly consumed this 100-request pool. This caused legitimate users to receive HTTP 429 errors, which the frontend mistakenly surfaced as *"Please check backend connection"*.

**Current Architecture:** Global rate limiting on `/api` was removed and replaced with a **Multi-Tier Targeted Rate Limiting Strategy**. Standard read endpoints are protected by JWT Authentication middleware rather than IP rate limiters, allowing uninterrupted user browsing.

---

## 2. Multi-Tier Rate Limiting Architecture

```
                                  Incoming Request
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │     Express Backend Server      │
                        └────────────────┬────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
 Tier 1: Authentication          Tier 2: AI & Heavy Ops           Tier 3: Standard Read Ops
 🔐 authLimiter                  🤖 aiLimiter                     🔓 No IP Rate Limit
 ───────────────────────         ────────────────────────         ─────────────────────────
 • /api/auth/register            • /api/exams/upload-paper        • /api/exams/list
 • /api/auth/login               • /api/exams/generate-rubric     • /api/evaluations/paper/:id
                                 • /api/evaluations/upload-ans    • /api/exams/:id (DELETE)
 
 Default: 15 req / 15 min        Default: 20 req / 15 min        Protected by JWT Auth middleware
 Prevents brute force            Prevents API cost depletion      Smooth & fast UI rendering
```

---

## 3. Rate Limiting Middleware Implementation

All limiters are managed centrally in [`backend/middleware/rateLimiter.js`](file:///c:/Users/DIVYA/OneDrive/Desktop/All%20in%20one%20projects/Aicte%20project%20repo/Parakh/backend/middleware/rateLimiter.js).

### A. Auth Rate Limiter (`authLimiter`)
Applied to `/api/auth/register` and `/api/auth/login` in [`backend/routes/authRoutes.js`](file:///c:/Users/DIVYA/OneDrive/Desktop/All%20in%20one%20projects/Aicte%20project%20repo/Parakh/backend/routes/authRoutes.js).

- **Window**: 15 minutes (default)
- **Max Requests**: 15 attempts per IP
- **HTTP Code**: `429 Too Many Requests`
- **Response Payload**:
  ```json
  {
    "success": false,
    "error": "Too many authentication attempts from this IP. Please try again after 15 minutes.",
    "code": "AUTH_RATE_LIMIT_EXCEEDED"
  }
  ```

### B. AI & Heavy Operations Rate Limiter (`aiLimiter`)
Applied to `/api/exams/upload-paper`, `/api/exams/generate-rubric` in [`backend/routes/examRoutes.js`](file:///c:/Users/DIVYA/OneDrive/Desktop/All%20in%20one%20projects/Aicte%20project%20repo/Parakh/backend/routes/examRoutes.js) and `/api/evaluations/upload-answers` in [`backend/routes/evaluationRoutes.js`](file:///c:/Users/DIVYA/OneDrive/Desktop/All%20in%20one%20projects/Aicte%20project%20repo/Parakh/backend/routes/evaluationRoutes.js).

- **Window**: 15 minutes (default)
- **Max Requests**: 20 requests per IP
- **HTTP Code**: `429 Too Many Requests`
- **Response Payload**:
  ```json
  {
    "success": false,
    "error": "Too many AI processing requests from this IP. Please try again after 15 minutes.",
    "code": "AI_RATE_LIMIT_EXCEEDED"
  }
  ```

---

## 4. Environment Variables Configuration

Rate limits can be customized per environment without modifying source code by setting environment variables in `backend/.env`:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `RATE_LIMIT_AUTH_WINDOW_MS` | `900000` (15 mins) | Time window in milliseconds for authentication rate limiting |
| `RATE_LIMIT_AUTH_MAX` | `15` | Maximum allowed auth attempts per window per IP |
| `RATE_LIMIT_AI_WINDOW_MS` | `900000` (15 mins) | Time window in milliseconds for AI & upload rate limiting |
| `RATE_LIMIT_AI_MAX` | `20` | Maximum allowed AI operations per window per IP |

---

## 5. Frontend Error Handling Best Practices

When consuming APIs from the React client, always check HTTP status codes specifically:

```javascript
const res = await authFetch('/api/exams/upload-paper', { method: 'POST', body });

if (!res.ok) {
  if (res.status === 429) {
    const errorData = await res.json();
    // Display targeted rate-limit error message to user
    toast.error(errorData.error || "Rate limit reached. Please wait a few minutes.");
    return;
  }
  // Generic server / network error
  toast.error("Failed to upload paper. Please check connection.");
}
```

By distinguishing status `429` from standard errors, the user receives actionable feedback (*"Rate limit reached, please wait"*) rather than false connection failure warnings.
