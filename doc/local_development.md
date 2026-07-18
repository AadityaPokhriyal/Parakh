# 💻 Local Development Setup

This guide walks you through setting up and running all services of the **AI-Powered Answer Sheet Evaluation System** concurrently on your local machine for development.

---

## 📋 Prerequisites

Ensure your machine has the following software installed:
- **Node.js** (v18.x or later)
- **NPM** (v9.x or later)
- **Python** (v3.10.x or later)
- **Git**

---

## 🛠️ Step 1: Clone the Repo & Set Up Envs

1. Clone the repository and navigate into the `Parakh/` root.
2. You need to configure **three** separate environment files for the orchestrator and the AI services.

### A. Gateway Environment Setup (`Parakh/backend/.env`)
Create a `.env` file inside `Parakh/backend/`:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AI_SERVICE_URL=http://localhost:3000
AI_EVALUATION_SERVICE_URL=http://localhost:8000
```

### B. Question Paper Parsing Environment Setup (`Parakh/ai-service/QP-parsing/.env`)
Create a `.env` file inside `Parakh/ai-service/QP-parsing/`:
```env
PORT=3000
GEMINI_API_KEY=your_google_gemini_api_key
```

### C. Answer Sheet Evaluation Environment Setup (`Parakh/ai-service/AS-parsing/.env`)
Create a `.env` file inside `Parakh/ai-service/AS-parsing/`:
```env
GEMINI_API_KEY=your_google_gemini_api_key
```

### D. Frontend Environment Setup (`Parakh/frontend/.env`)
Create a `.env` file inside `Parakh/frontend/`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🚀 Step 2: Start the Services (Concurrently)

To run the application locally, you must spin up all 4 components in separate terminal windows.

### 📡 Terminal 1: QP-Parsing AI Service (Node.js)
This service parses the question paper PDFs on port `3000`.
```bash
cd Parakh/ai-service/QP-parsing
npm install
npm start
```
*Expected Output:* `Listening to port 3000...`

---

### 🐍 Terminal 2: AS-Parsing AI Service (Python FastAPI)
This service evaluates the answer sheets on port `8000`.

**On Windows (Command Prompt/PowerShell):**
```powershell
cd Parakh/ai-service/AS-parsing
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
fastapi dev app.py --port 8000
```

**On Linux/macOS:**
```bash
cd Parakh/ai-service/AS-parsing
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
fastapi dev app.py --port 8000
```

*Expected Output:* `Application startup complete.` on `http://127.0.0.1:8000`

---

### 🎛️ Terminal 3: Express Backend Orchestrator (Node.js)
The gateway API controller on port `5000`.
```bash
cd Parakh/backend
npm install
npm run dev
```
*Expected Output:* `Backend server running on http://localhost:5000`

---

### 🎨 Terminal 4: React Web Frontend (Vite)
The user interface dashboard running on port `5173`.
```bash
cd Parakh/frontend
npm install
npm run dev
```
*Expected Output:* `  ➜  Local:   http://localhost:5173/`

---

## 🔍 Verification Flow

1. Open `http://localhost:5173/` in your browser.
2. Click **Upload Question Paper** and upload a test PDF paper.
3. Verify that the AI extracts the questions list and presents it to you on the **Review Questions** screen.
4. Set marks and edit rubrics, then click **Save**.
5. Upload a handwritten student answer sheet PDF on the **Evaluation** tab.
6. Verify that the system outputs the marks dashboard showing criteria met/not met, detailed comments, and gives you a download option for the PDF report.

---

## 🛠️ Common Troubleshooting

*   **FastAPI venv activation error (Windows)**:
    If PowerShell blocks script execution, run the following command as an administrator:
    `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
*   **SUPABASE connection error**:
    Make sure your SQL schema is created. You can find the database setup scripts at [schema.sql](./Architectural%20docs/schema.sql). Ensure your database is not paused in the Supabase control panel.
*   **Gemini API rate limits (`429 Too Many Requests`)**:
    If you encounter rate limits on free-tier Gemini API keys, the system contains retry algorithms with exponential backoffs. Wait a minute and submit again.
