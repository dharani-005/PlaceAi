# 🎓 PlaceAI — AI-Powered Resume Screening & Talent Matching System

A full-stack campus placement automation platform with two user roles (Placement Cell Admin + Students), AI-powered resume scoring, semantic skill matching, and a personalised chatbot.

---

## Prerequisites

Before you begin, install the following:

| Tool | Download |
|------|----------|
| **Python 3.11+** | https://www.python.org/downloads/ |
| **Node.js 18+** | https://nodejs.org/ |
| **PostgreSQL 15+** | https://www.postgresql.org/download/windows/ |
| **Git** (optional) | https://git-scm.com/ |

---

## Step 1 — Set Up PostgreSQL

1. Install PostgreSQL and launch **pgAdmin** or use `psql` in your terminal.
2. Create a new database:
   ```sql
   CREATE DATABASE placement_db;
   ```
3. Note your PostgreSQL **username** (default: `postgres`) and **password**.

---

## Step 2 — Configure the Backend

```powershell
cd "backend"
```

1. Edit `.env` and fill in your real values:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/placement_db
   SECRET_KEY=generate_a_32_char_random_string_here
   NEXUS_API_BASE_URL=https://your-nexus-api-url
   NEXUS_API_KEY=your-nexus-api-key
   ```

2. Create a Python virtual environment and install dependencies:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Download the spaCy English model (used for NLP parsing):
   ```powershell
   python -m spacy download en_core_web_sm
   ```

4. Run the database seed script (creates tables + demo accounts):
   ```powershell
   python seed.py
   ```

   ✅ This creates:
   - **Admin:** `admin@placement.edu` / `admin123`
   - **Student:** `student@college.edu` / `student123`
   - **3 sample job descriptions** (Stradegi, TCS, Infosys)

---

## Step 3 — Start the Backend

```powershell
# From the backend/ directory with venv activated
uvicorn main:app --reload --port 8000
```

The API is now running at `http://localhost:8000`

- Interactive API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

---

## Step 4 — Set Up and Start the Frontend

Open a **new** PowerShell window:

```powershell
cd "frontend"
npm install
npm run dev
```

The app is now running at **http://localhost:5173** 🚀

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | `student@college.edu` | `student123` |
| Admin (Placement Cell) | `admin@placement.edu` | `admin123` |

---

## Feature Walkthrough

### Student Flow
1. **Login** → auto-redirected to student portal
2. **Resume Upload** → drag & drop PDF/DOCX → get instant ATS score (0–100) with breakdown
3. **Academic Profile** → enter CGPA, branch, batch year, backlogs
4. **Match Dashboard** → click "Check Match" on any job → see eligibility + skill match score
5. **Role Roadmap** → type a target role → AI generates personalised learning path → track progress
6. **Interview Prep** → chat with AI in Q&A or mock interview mode

### Admin Flow
1. **Login** → auto-redirected to placement cell dashboard
2. **Post Job** → fill company info, eligibility criteria, interview rounds, requirements
3. **Job List** → view, edit, delete postings
4. **Candidates** → see ranked eligible students sorted by match score

---

## Architecture

```
Main project 1/
├── backend/               # FastAPI + PostgreSQL
│   ├── main.py            # App entry point
│   ├── models.py          # SQLAlchemy ORM (7 tables)
│   ├── services/
│   │   ├── resume_parser.py    # PyMuPDF / python-docx
│   │   ├── ats_scorer.py       # Rule-based scoring (100 pts)
│   │   ├── matcher.py          # SBERT semantic matching
│   │   ├── roadmap_gen.py      # Nexus API → roadmap
│   │   └── chatbot_service.py  # Nexus API → chat
│   └── routers/           # 7 API routers
└── frontend/              # React 18 + Vite + Tailwind
    └── src/
        ├── pages/student/  # 5 student pages
        └── pages/admin/    # 4 admin pages
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `psycopg2` connection error | Check DATABASE_URL, ensure PostgreSQL is running |
| `sentence-transformers` slow on first load | Normal — it downloads the MiniLM model (~80MB) once |
| Nexus API 401 error | Check NEXUS_API_KEY in `.env` |
| Port 5173 in use | Run `npm run dev -- --port 3000` |
| Port 8000 in use | Run `uvicorn main:app --reload --port 8001` and update `vite.config.js` proxy |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | Python 3.11 + FastAPI |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL |
| Auth | JWT (python-jose) + bcrypt |
| Resume parsing | PyMuPDF, python-docx |
| ATS scoring | Rule-based Python |
| Skill matching | sentence-transformers (MiniLM-L6-v2) + scikit-learn |
| AI features | Nexus API (OpenAI-compatible) |
