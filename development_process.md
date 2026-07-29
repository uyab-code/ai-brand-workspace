# AI Brand Workspace - Development Process

## Ringkasan Project (25 Juli 2026)

### ✅ Completed

**Phase 1: Foundation**
- Auth system (JWT login, refresh token, forgot/reset password)
- Organization management (CRUD, members, roles)
- Invitation-only system (superadmin invite user, user set password)
- Superadmin role (is_superuser flag, system-level access)
- Dashboard layout (sidebar, navbar)

**Phase 2: Client & Assets**
- Client CRUD (clickable cards, detail page, edit, delete)
- Asset library (logo upload, guideline PDF, reference images)
- Brand colors management (hex codes, view/edit)
- Brand style management (text description, view/edit)
- Brand fonts management (add/remove, primary/secondary/accent)

**Phase 3: Content Library** ✅ SELESAI
- **Perubahan desain:** Campaign & Calendar dihilangkan, diganti Content Library
- Konsep baru: Content Brief (brief konten dengan slides) + Brief Slide (sub-item per slide)
- **Backend models:** ContentBrief (organization_id, client_id, name, content_type, platform, deadline_date, status) + BriefSlide (brief_id, slide_title, brief_text, notes, slide_number)
- **Backend schemas:** CreateBriefRequest (dengan slides array), ContentBriefResponse, BriefSlideResponse, UpdateStatusRequest
- **Backend service:** ContentBriefService — create_brief (transactional dengan slides), list, get, update, update_status, update_slide (inline), delete, get_upcoming, get_stats
- **Backend API routes:** 9 endpoints di /api/content-briefs
- **Alembic migration:** 2 versi (content_briefs + brief_slides, rename brief→brief_text)
- **Bug fixes:**
  - Kolom `brief` di BriefSlide di-rename ke `brief_text` (konflik nama)
  - Role `owner` di team_members di-update ke `admin` (tidak ada di enum)
- **Frontend:** Content Library table, detail page dengan inline slide editing
- **Sidebar:** Content Library menggantikan Campaigns + Calendar

**Phase 4: AI Design Generator + Design Director** ✅ SELESAI

*Backend Models & Schemas:*
- GeneratedDesign (client_id, content_brief_id, slide_id, image_url, prompt_used, content_type, version, credits_used)
- Credit (organization_id, balance, used, plan)
- Alembic migrations: generated_designs, credits, slide_id FK, image_url→Text

*Backend Services:*
- **ai_service.py** — 2 provider (Pollinations gratis / OpenAI berbayar) + Design Director (Gemini/GPT)
- **credit_service.py** — auto-init 200 credits, deduct, add
- **design_service.py** — single + carousel generation + brand memory + Design Director

*AI Pipeline:*
```
User prompt → Design Director (Gemini/GPT) → elaborated prompt
    → Brand Memory injection (style, colors, fonts) → Image Generator
```
- **Design Director:** Mengubah prompt simpel user jadi brief desain detail
  - Provider: Gemini 2.0 Flash (free tier) atau GPT-4o-mini
  - Fallback: jika error, pakai prompt user asli
- **Brand Memory:** Otomatis inject brand style, colors, fonts, logo ke prompt
- **Image Generator:** Pollinations.ai (gratis) atau OpenAI DALL-E 3 (berbayar)
  - Fallback: OpenAI error → otomatis pakai Pollinations

*Backend API routes:*
- `/api/designs/generate` — generate single (dengan slide_id)
- `/api/designs/generate/carousel` — generate carousel
- `/api/designs/client/{id}` — list designs by client
- `/api/designs/slide/{id}` — list designs by slide
- `/api/designs/detail/{id}` — get design detail
- `/api/designs/{id}` — delete design
- `/api/credits/{org_id}` — get credit balance

*Frontend:*
- Per-slide generate di Content Library detail page (input prompt + Generate)
- Image ditampilkan inline di bawah slide
- Design detail page (hanya tampilkan user prompt, brand memory hidden)
- Dashboard: Credits card (real data), Recent Designs (4 thumbnail)
- Sidebar: Hapus "Designs" tab (generate sudah inline di Content Library)

*Credit System:*
- 200 credits default per organization (freelancer plan)
- 1 credit per generate (single atau carousel per slide)
- Balance: 176 tersisa, 24 terpakai

*Bug fixes Phase 4:*
- `image_url` di `generated_designs` diubah dari `String(500)` ke `Text` (URL Pollinations terlalu panjang)
- `slide_id` FK ditambahkan ke `generated_designs` untuk link ke slide spesifik

### 🔁 Session 2: Design Director Activation + GPT-5 Series

**Design Director (28 Juli 2026)** ✅ SELESAI
- Provider: OpenAI → `AI_TEXT_PROVIDER=openai`
- Model: `DESIGN_DIRECTOR_MODEL=gpt-5-mini` ($0.25/1M input, $2/1M output)
- Flow: `User Prompt → Structured Prompt (15 section) → gpt-5-mini elaborate → gpt-image-2 generate`

**Image Generator Upgrade** ✅ SELESAI
- Model: `gpt-image-1` (deprecated) → `gpt-image-2`
- Config: `OPENAI_MODEL=gpt-image-2`

**Design Director Model Options:**
- `gpt-5-nano`: $0.05/$0.40 — termurah
- `gpt-5-mini` ⭐: $0.25/$2.00 — best value (current)
- `gpt-5`: $1.25/$10.00 — high quality
- `gpt-5.5`: $5.00/$30.00 — premium

**Removed:**
- Standalone `/dashboard/designs/generate` page — generation inline in brief detail
- "Generate Design" from sidebar

**UI/UX Improvements (Step 1-5)** ✅ SELESAI

*Step 1: Auth & General UX*
- Register page → redirect ke login (sistem invitation-only)
- Sidebar active state → highlight halaman aktif via `pathname.startsWith()`
- Toast notifications → `ToastProvider` + `useToast()` hook + slide-in animation
- Dashboard layout → wrap dengan `ToastProvider`

*Step 2: Clients*
- Validasi hex color (#FF0000 format) untuk brand colors
- Upload error handling → toast error jika gagal upload
- Loading indicator per asset (logo, guideline, reference) dengan overlay
- Toast untuk semua aksi: save, upload, add font, remove font, delete

*Step 3: Content Library*
- Loading skeleton placeholder saat data dimuat
- Empty state lebih informatif

*Step 4: Dashboard & Navigation*
- Recent Designs → load dari SEMUA client (bukan hanya pertama)
- Promise.allSettled untuk resilient data loading
- Credits card menampilkan balance real
- Navbar → user dropdown dengan nama + email + logout

*Step 5: Mobile Responsive*
- Sidebar → collapsible di mobile (hamburger menu di Navbar)
- Mobile overlay → tap di luar sidebar untuk tutup
- Close button di sidebar untuk mobile
- Responsive grids → `sm:grid-cols-2 lg:grid-cols-4` dengan gap responsive
- Navbar → responsive sizing (avatar + nama)
- Main content → padding responsive (`p-3 md:p-6`)

**Admin Monitoring Dashboard** ✅ SELESAI
- Backend: admin API routes (stats, organizations)
- Frontend: `/dashboard/admin` — overview cards + organizations table
- Sidebar: menu "Admin" hanya tampil untuk superadmin

**Fix Content Briefs Table** ✅ SELESAI
- Seluruh baris table bisa di-klik ke detail page

### ❌ Not Started

- Phase 5: Approval Workflow (Module 8)
- Phase 6: Launch Preparation

### Branch & Git
- Default branch: main
- All other branches deleted (develop, worktree-*)
- Latest commit: e3cd9dc (docs: add README)

### Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- Backend: FastAPI, Python 3.14, SQLAlchemy, Alembic, google-genai
- Database: PostgreSQL 16 (Docker, port 5433)
- Auth: JWT (access + refresh) + Argon2
- AI: Pollinations.ai (gratis), OpenAI DALL-E 3 (berbayar), Gemini 2.0 Flash (Design Director)

### Database Tables (11 total)
1. users
2. organizations
3. team_members
4. invitations
5. clients
6. brand_assets
7. content_briefs
8. brief_slides
9. generated_designs
10. credits
11. alembic_version

### Alembic Migrations (13 total)
- cbd740712a18 — initial (users, orgs, team_members)
- e1a2b3c4d5e6 — add is_superuser
- da94f55edcd4 — add superadmin role
- 0e14fca84567 / 5cee287d01a5 — invitation table
- d017d58685a5 — clients + brand_assets
- 0619a5af74e9 — campaigns + content_items (later dropped)
- 525cbfd0619e — content_briefs + brief_slides, drop campaigns + content_items
- e63fd2638fa7 — rename brief → brief_text
- 712d2957068d — generated_designs + credits
- 70dea5f94a5b — add slide_id FK
- 4aaac3f1e708 — image_url String(500) → Text

### Cara Menjalankan
1. docker-compose up -d (PostgreSQL, Redis, MailHog)
2. cd backend && source venv/Scripts/activate && uvicorn app.main:app --reload --port 8000
3. cd frontend && npm run dev

### Akses
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Login: yabo@gmail.com / yaboyabo (superadmin)

### Konfigurasi AI (backend/.env)
```bash
# Image Generation
AI_PROVIDER=pollinations  # "pollinations" (gratis) atau "openai" (berbayar)

# Design Director
AI_TEXT_PROVIDER=gemini   # "gemini" (gratis) atau "openai" (berbayar)
GEMINI_API_KEY=AIzaSy...  # dari aistudio.google.com/apikey

# OpenAI (opsional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=dall-e-3
```

### Flow Generate Image
```
1. User ketik prompt simpel di Content Library detail slide
2. Design Director (Gemini) mengelaborasi → prompt detail
3. Brand Memory di-inject (warna, style, font, logo)
4. Image Generator (Pollinations/OpenAI) menghasilkan gambar
5. 1 credit terpakai, image ditampilkan di slide
```

### Catatan Penting
- Tab "Designs" di sidebar sudah dihapus — generate inline di Content Library
- Design detail page (`/dashboard/designs/[id]`) hanya bisa diakses dari klik image di brief detail
- Prompt brand memory tidak ditampilkan ke user di design detail — hanya user prompt
- File frontend yang dihapus: `dashboard/designs/page.tsx` (gallery), `dashboard/designs/generate/page.tsx`
