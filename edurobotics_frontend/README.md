# EduRobotics Platform

Educational robotics platform with course management, modules, units, and progress tracking. Includes admin and student roles.

## Tech Stack

**Backend:**
- FastAPI with SQLAlchemy ORM
- Structlog for logging
- SQLite database
- Modular API in `/api`

**Frontend:**
- React 18 + Vite
- TailwindCSS + shadcn/ui
- React Router v6

## Installation

### Backend
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend-react
npm install
```

## Running

You need 2 terminals:

**Terminal 1 - Backend (port 8001):**
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

**Terminal 2 - Frontend (port 5173):**
```bash
cd frontend-react
npm run dev
```

Open http://localhost:5173

## Structure

- `backend/models/` - SQLAlchemy models (User, Course, Module, Unit, Content, Quiz, Progress)
- `backend/schemas/` - Pydantic validation
- `backend/services/` - Business logic
- `backend/api/` - REST endpoints
- `frontend-react/src/pages/` - Pages (Login, Admin/Student dashboards)
- `tests/` - Unit tests (coming soon)

## API Docs

Once backend is running: http://localhost:8001/docs

---
*Developed by CIRTA CORP*