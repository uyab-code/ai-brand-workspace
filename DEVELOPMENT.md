# DEVELOPMENT.md - Development Phases & Project Setup

## AI Brand Workspace for Agencies

Document ini menjadi panduan utama selama proses development MVP.

---

## 1. Development Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | FastAPI, Python 3.12+, SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL 16 |
| Storage | Google Cloud Storage |
| AI | OpenAI Image Generation API |
| Infrastructure | Google Cloud Run, Docker |

### Architecture

**Modular Monolith** - Single deployable unit dengan modul yang terorganisir.

### Project Structure

```
ai-brand-workspace/
│
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Settings & environment config
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── __init__.py
│   │   │   ├── deps.py               # Dependencies injection
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── auth.py
│   │   │       ├── organizations.py
│   │   │       ├── clients.py
│   │   │       ├── assets.py
│   │   │       ├── campaigns.py
│   │   │       ├── content.py
│   │   │       ├── designs.py
│   │   │       ├── approvals.py
│   │   │       └── comments.py
│   │   │
│   │   ├── core/                     # Core utilities
│   │   │   ├── __init__.py
│   │   │   ├── security.py           # JWT, password hashing
│   │   │   ├── permissions.py        # RBAC
│   │   │   └── exceptions.py         # Custom exceptions
│   │   │
│   │   ├── models/                   # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── organization.py
│   │   │   ├── client.py
│   │   │   ├── asset.py
│   │   │   ├── campaign.py
│   │   │   ├── content.py
│   │   │   ├── design.py
│   │   │   ├── approval.py
│   │   │   └── credit.py
│   │   │
│   │   ├── schemas/                  # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── organization.py
│   │   │   ├── client.py
│   │   │   ├── asset.py
│   │   │   ├── campaign.py
│   │   │   ├── content.py
│   │   │   ├── design.py
│   │   │   ├── approval.py
│   │   │   └── common.py             # Base response schemas
│   │   │
│   │   ├── services/                 # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── organization_service.py
│   │   │   ├── client_service.py
│   │   │   ├── asset_service.py
│   │   │   ├── campaign_service.py
│   │   │   ├── content_service.py
│   │   │   ├── design_service.py
│   │   │   ├── approval_service.py
│   │   │   ├── storage_service.py    # GCS integration
│   │   │   └── ai_service.py         # OpenAI integration
│   │   │
│   │   └── utils/                    # Helper functions
│   │       ├── __init__.py
│   │       └── helpers.py
│   │
│   ├── alembic/                      # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   │
│   ├── tests/                        # Test files
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   └── ...
│   │
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                         # Next.js Frontend
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Landing/redirect
│   │   │   │
│   │   │   ├── (auth)/               # Auth routes (no layout)
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   │
│   │   │   ├── (dashboard)/          # Dashboard routes
│   │   │   │   ├── layout.tsx        # Dashboard layout
│   │   │   │   ├── page.tsx          # Dashboard home
│   │   │   │   ├── clients/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── calendar/
│   │   │   │   ├── designs/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   └── api/                  # Next.js API routes (if needed)
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/               # Layout components
│   │   │   ├── clients/              # Client module components
│   │   │   ├── assets/               # Asset library components
│   │   │   ├── campaigns/            # Campaign components
│   │   │   ├── calendar/             # Content calendar components
│   │   │   ├── designs/              # Design generator components
│   │   │   └── approvals/            # Approval workflow components
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useClients.ts
│   │   │   └── ...
│   │   │
│   │   ├── lib/                      # Utilities
│   │   │   ├── api.ts                # API client
│   │   │   ├── auth.ts               # Auth utilities
│   │   │   └── utils.ts
│   │   │
│   │   ├── types/                    # TypeScript types
│   │   │   ├── api.ts
│   │   │   ├── client.ts
│   │   │   └── ...
│   │   │
│   │   └── api/                      # API functions
│   │       ├── auth.ts
│   │       ├── clients.ts
│   │       └── ...
│   │
│   ├── public/                       # Static assets
│   ├── components.json               # shadcn config
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local.example
│
├── docker-compose.yml                # Development services
├── docker-compose.prod.yml           # Production services
├── .gitignore
├── .env.example                      # Root env template
│
├── PRD.md                           # Product Requirements
├── DESIGN.md                        # Technical Design
└── DEVELOPMENT.md                   # This file
```

---

## 2. Project Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ | Backend runtime |
| Node.js | 20+ | Frontend runtime |
| Docker | Latest | Containerization |
| Docker Compose | Latest | Service orchestration |
| Git | Latest | Version control |

### Quick Start with Docker

```bash
# 1. Clone repository
git clone <repository-url>
cd ai-brand-workspace

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Start development services
docker-compose up -d

# 4. Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 5. Run database migrations
alembic upgrade head

# 6. Start backend server
uvicorn app.main:app --reload --port 8000

# 7. In new terminal, install frontend dependencies
cd frontend
npm install

# 8. Start frontend server
npm run dev
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: brandwork-postgres
    environment:
      POSTGRES_DB: brandwork_db
      POSTGRES_USER: brandwork_user
      POSTGRES_PASSWORD: brandwork_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U brandwork_user -d brandwork_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: brandwork-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    container_name: brandwork-mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

#### Backend (.env)

```bash
# Application
APP_NAME=AI Brand Workspace
APP_ENV=development
DEBUG=true

# Database
DATABASE_URL=postgresql+asyncpg://brandwork_user:brandwork_password@localhost:5432/brandwork_db

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google Cloud Storage
GCS_BUCKET_NAME=brandwork-assets
GCS_CREDENTIALS_PATH=./credentials/gcs-service-account.json

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=dall-e-3

# Email (for password reset)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
```

#### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# App
NEXT_PUBLIC_APP_NAME=AI Brand Workspace
```

---

## 3. Development Phases

### Phase 1: Foundation (Week 1-2)

**Focus:** Project setup, Authentication, Organization management, Invitation system

**Note:** Public registration is disabled. Users are invited by admin/owner.

#### Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Project initialization | Setup monorepo, Docker Compose, base configs |
| 3-4 | Database setup | Create all models, run initial migration |
| 5-6 | Auth module (Backend) | Login, JWT, Password Reset |
| 7-8 | Organization module (Backend) | Create org, Roles |
| 9-10 | Invitation module (Backend) | Invite, Set Password |
| 11-12 | Auth UI (Frontend) | Login pages |
| 13 | Dashboard layout | Sidebar, navbar, basic layout |
| 14 | Integration testing | Test full auth flow |

#### Deliverables
- [x] Working Docker Compose setup
- [x] Database schema with all tables
- [x] Auth API (login, refresh, logout)
- [x] Organization API (create, roles)
- [x] Invitation API (invite, set password)
- [x] Login page
- [x] Invite page (set password)
- [x] Basic dashboard layout

#### Evaluation Checklist
- [ ] User can login with invited account
- [ ] JWT tokens work correctly
- [ ] Refresh token flow works
- [ ] Organization can be created
- [ ] Admin can invite team members
- [ ] Invited users can set password
- [ ] Public registration is disabled
- [ ] Roles are enforced (Owner/Admin/Designer)
- [ ] No critical security vulnerabilities

---

### Phase 2: Client & Assets (Week 3-4)

**Focus:** Client management, Brand asset library

#### Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Client CRUD (Backend) | Create, Read, Update, Delete |
| 3-4 | Asset model & API | Brand assets endpoints |
| 5-6 | GCS integration | File upload service |
| 7-8 | Font management | Upload OTF/TTF, font CRUD |
| 9-10 | Client UI | Client list, detail, forms |
| 11-12 | Asset library UI | Upload, preview, manage assets |
| 13 | Brand colors & style UI | Color picker, style form |
| 14 | Integration testing | Test full client flow |

#### Deliverables
- [x] Client CRUD API
- [x] Asset library API (logo, guideline, reference, fonts)
- [x] GCS file upload service
- [x] Client management pages
- [x] Asset library pages

#### Evaluation Checklist
- [ ] Can create, edit, delete clients
- [ ] Can upload logo (JPG/PNG)
- [ ] Can upload guideline (PDF)
- [ ] Can upload reference images
- [ ] Can add brand fonts (name + optional file)
- [ ] Can manage brand colors
- [ ] Can update brand style description
- [ ] Files are stored in GCS
- [ ] Asset preview works correctly

---

### Phase 3: Campaign & Calendar (Week 5-6)

**Focus:** Campaign management, Content calendar

#### Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Campaign CRUD (Backend) | Create, Read, Update, Delete |
| 3-4 | Content items API | Content calendar endpoints |
| 5-6 | Status workflow | State machine for content status |
| 7-8 | Campaign UI | Campaign list, detail, forms |
| 9-10 | Calendar UI | Calendar view, drag & drop |
| 11-12 | Status workflow UI | Status badges, transitions |
| 13 | Dashboard widgets | Upcoming content, stats |
| 14 | Integration testing | Test campaign flow |

#### Deliverables
- [x] Campaign CRUD API
- [x] Content calendar API
- [x] Status workflow (Draft → Published)
- [x] Campaign management pages
- [x] Content calendar page

#### Evaluation Checklist
- [ ] Can create, edit, delete campaigns
- [ ] Can create content items
- [ ] Status transitions work correctly
- [ ] Calendar view displays correctly
- [ ] Campaign linked to correct client
- [ ] Content items linked to campaigns

---

### Phase 4: AI Integration (Week 7-9)

**Focus:** AI design generation, Brand memory, Credit system

#### Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | AI Brand Memory | Prompt assembly with brand context |
| 3-4 | OpenAI integration | Image generation service |
| 5-6 | Single design API | Generate single image |
| 7-8 | Carousel API | Generate multiple images |
| 9-10 | Upload images handling | Additional reference images |
| 11-12 | Credit system | Deduct credits, check balance |
| 13-14 | Design history | Store & retrieve past designs |
| 15-16 | Design generator UI | Single design form |
| 17-18 | Carousel UI | Multi-slide form |
| 19-20 | Results display | Gallery view, download |
| 21 | Credit display | Show balance, history |

#### Deliverables
- [x] AI Brand Memory system
- [x] Single design generator API
- [x] Carousel design generator API
- [x] Credit system
- [x] Design history
- [x] Design generator UI

#### Evaluation Checklist
- [ ] Brand colors injected into prompt
- [ ] Brand style injected into prompt
- [ ] Logo reference included
- [ ] Fonts mentioned in prompt
- [ ] Upload images used as reference
- [ ] Single design generates correctly
- [ ] Carousel generates multiple images
- [ ] Credits deducted correctly
- [ ] Design history saved
- [ ] Can reuse previous prompts

---

### Phase 5: Approval & Polish (Week 10-11)

**Focus:** Approval workflow, Comments, UI refinement

#### Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Approval API | Submit, approve, revision |
| 3-4 | Comments API | Add, list comments |
| 5-6 | Approval UI | Review interface |
| 7-8 | Comments UI | Comment thread |
| 9-10 | Design versioning | Version history |
| 11-12 | UI/UX polish | Loading states, error handling |
| 13-14 | Responsive design | Mobile optimization |

#### Deliverables
- [x] Approval workflow API
- [x] Comments system
- [x] Approval UI
- [x] Comments UI
- [x] Polished UI/UX

#### Evaluation Checklist
- [ ] Can submit for review
- [ ] Can approve design
- [ ] Can request revision
- [ ] Comments display correctly
- [ ] Status transitions work
- [ ] Loading states present
- [ ] Error messages clear
- [ ] Responsive on mobile

---

### Phase 6: Launch Prep (Week 12)

**Focus:** Testing, Security, Documentation, Deployment

#### Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Unit tests | Core business logic |
| 3-4 | API testing | Endpoint testing |
| 5-6 | Security audit | OWASP checklist |
| 7-8 | Performance optimization | Query optimization, caching |
| 9-10 | Documentation | API docs, user guide |
| 11 | Deployment setup | Cloud Run config |
| 12 | Final testing | End-to-end verification |

#### Deliverables
- [x] Test coverage > 60%
- [x] API documentation
- [x] Security audit passed
- [x] Performance benchmarks
- [x] Deployment ready

#### Evaluation Checklist
- [ ] All critical paths tested
- [ ] No SQL injection vulnerabilities
- [ ] JWT properly validated
- [ ] File upload size limits enforced
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Error logging working
- [ ] Deployment successful

---

## 4. Evaluation Template

Untuk setiap phase completion, gunakan checklist ini:

```markdown
## Phase X Evaluation

### Functional
- [ ] All features implemented
- [ ] All API endpoints working
- [ ] All UI pages functional

### Quality
- [ ] No critical bugs
- [ ] No security vulnerabilities
- [ ] Error handling implemented

### Technical
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation updated

### Ready for Next Phase
- [ ] Dependencies resolved
- [ ] Tech debt acceptable
- [ ] Performance acceptable
```

---

## 5. Git Branching Strategy

### Branch Structure

```
main                    # Production branch
│
├── develop             # Integration branch
│   │
│   ├── feature/phase-1-auth
│   ├── feature/phase-1-organization
│   ├── feature/phase-2-clients
│   ├── feature/phase-2-assets
│   ├── feature/phase-3-campaigns
│   ├── feature/phase-3-calendar
│   ├── feature/phase-4-ai-generator
│   ├── feature/phase-4-credits
│   ├── feature/phase-5-approval
│   └── fix/issue-description
```

### Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/phase-1-auth

# Work on feature
git add .
git commit -m "feat(auth): implement register endpoint"

# Push and create PR
git push origin feature/phase-1-auth
# Create PR to develop

# After review and merge
git checkout develop
git pull origin develop
git branch -d feature/phase-1-auth
```

### Commit Convention

```
feat(module): description
fix(module): description
docs(module): description
refactor(module): description
test(module): description
```

---

## 6. Coding Standards

### Python (FastAPI)

```python
# Type hints are required
async def get_client(client_id: UUID) -> Client:
    pass

# Use async/await for database operations
async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
    client = Client(**data.model_dump())
    db.add(client)
    await db.commit()
    return client

# Pydantic schemas for request/response
class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    status: ClientStatus = ClientStatus.ACTIVE
```

### TypeScript (Next.js)

```typescript
// Use interfaces for types
interface Client {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
}

// Use TanStack Query for data fetching
const { data: clients, isLoading } = useQuery({
  queryKey: ['clients'],
  queryFn: () => api.clients.list(),
});

// Use server actions for mutations
async function createClient(data: ClientCreate) {
  'use server';
  // ...
}
```

### API Response Format

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required"
  }
}

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

---

## 7. Key Commands Reference

### Backend

```bash
# Run development server
uvicorn app.main:app --reload --port 8000

# Run migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
alembic downgrade -1

# Run tests
pytest
pytest -v
pytest --cov=app

# Lint & format
ruff check .
ruff format .
```

### Frontend

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint & format
npm run lint
npm run format
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

---

**Document Version:** 1.0
**Last Updated:** July 22, 2026
**Author:** Engineering Team
