# AI Brand Workspace for Agencies

Platform SaaS yang membantu agency, freelancer social media, dan marketing team mengelola brand asset, merencanakan konten, menghasilkan desain berbasis AI, serta menjalankan workflow kolaborasi dan approval dalam satu sistem.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12+, SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL 16 |
| Storage | Google Cloud Storage |
| AI | OpenAI Image Generation API |
| Infrastructure | Google Cloud Run, Docker |

## Features

### Auth & Organization
- Login with JWT (Access + Refresh Token)
- Invitation-only registration (Superadmin/Admin invite flow)
- Role-based access: Superadmin, Admin, Designer

### Client Management
- CRUD clients per organization
- Client detail page with full asset overview

### Asset Library
- Upload logo, brand guideline PDF, reference images
- Manage brand colors (hex codes)
- Manage brand style description
- Manage brand fonts (primary, secondary, accent)

## Project Structure

```
ai-brand-workspace/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # API routes
│   │   ├── core/          # Security, permissions
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── alembic/           # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── api/           # API client functions
│   │   └── types/         # TypeScript types
│   └── package.json
├── docker-compose.yml
├── PRD.md                 # Product Requirements
├── DESIGN.md              # Technical Design
└── DEVELOPMENT.md         # Development Guide
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16

### Setup

```bash
# 1. Clone repository
git clone https://github.com/uyab-code/ai-brand-workspace.git
cd ai-brand-workspace

# 2. Start PostgreSQL
docker-compose up -d

# 3. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head

# 4. Setup Frontend
cd ../frontend
npm install

# 5. Start Development
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory and configure:

```bash
DATABASE_URL=postgresql+asyncpg://brandwork_user:brandwork_password@localhost:5433/brandwork_db
JWT_SECRET_KEY=your-secret-key
```

## API Documentation

Backend API docs available at: `http://localhost:8000/docs` (Swagger UI)

## Current Status

| Module | Status |
|--------|--------|
| Auth & Organization | Completed |
| Client Management | Completed |
| Asset Library | Completed |
| Campaign Management | Pending |
| Content Calendar | Pending |
| AI Design Generator | Pending |
| Approval Workflow | Pending |

## License

Private
