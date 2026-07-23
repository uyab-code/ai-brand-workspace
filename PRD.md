# PRD - AI Brand Workspace for Agencies

## Product Overview

AI Brand Workspace adalah platform SaaS yang membantu agency, freelancer social media, dan marketing team mengelola brand asset, merencanakan konten, menghasilkan desain berbasis AI, serta menjalankan workflow kolaborasi dan approval dalam satu sistem.

---

## Product Vision

Menjadi workspace terpusat untuk agency dalam mengelola banyak client dan mempercepat produksi konten menggunakan AI tanpa mengorbankan konsistensi brand.

---

## Problem Statement

Agency saat ini menggunakan banyak tools terpisah:

| Tool | Fungsi |
|------|--------|
| Google Drive | Asset storage |
| WhatsApp | Brief & komunikasi |
| Canva | Desain |
| Spreadsheet | Tracking |
| Trello/Notion | Workflow |

**Akibatnya:**

- Asset sulit dicari
- Workflow tidak terpusat
- Approval tidak terdokumentasi
- Konsistensi brand sulit dijaga
- Produktivitas tim rendah

---

## Target Users

### Primary Users

#### 1. Agency Owner

**Tujuan:**
- Mengelola banyak client
- Mengawasi produksi konten
- Menjaga kualitas output

#### 2. Account Manager

**Tujuan:**
- Mengelola campaign
- Mengelola content calendar
- Mengatur workflow tim

#### 3. Designer

**Tujuan:**
- Membuat desain lebih cepat
- Memanfaatkan asset brand
- Mengurangi pekerjaan repetitif

### Secondary Users

#### Freelancer Social Media Specialist

**Tujuan:**
- Mengelola beberapa client
- Menyimpan asset dengan rapi
- Menghasilkan konten lebih cepat

---

## Success Metrics

### Business Metrics

| Metric | Target |
|--------|--------|
| Pelanggan berbayar pertama | 20 |
| Agency aktif | 5 |
| Retention rate | > 60% |
| Pengguna membeli credit tambahan | 70% |

### Product Metrics

| Metric | Target |
|--------|--------|
| Generate image per bulan | 1.000 |
| Campaign memiliki content plan | 70% |
| Desain dibuat menggunakan asset brand | 80% |

---

## MVP Scope

### Module 1 - Authentication

**Features:**
- Login
- Logout
- Refresh Token
- Password Reset

**Note:** Public registration is disabled. Users can only join via invitation from admin/owner.

---

### Module 2 - Organization

**Features:**
- Create Organization
- Invite Team Member (via email invitation)
- Set Password (for invited users)
- Manage Roles

**Invitation Flow:**
1. Admin/Owner invites user by email
2. User receives email with invitation link
3. User clicks link and sets password
4. User is added to organization

**Roles:**

| Role | Description |
|------|-------------|
| Owner | Full access, manage organization settings |
| Admin | Manage members, clients, and campaigns |
| Designer | Create designs using brand assets |

---

### Module 3 - Client Management

**Features:**
- Create Client
- Update Client
- Delete Client
- View Client

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| Name | String | Client name |
| Description | Text | Client description |
| Status | Enum | Active/Inactive |

---

### Module 4 - Asset Library

**Features:**
- Upload Logo
- Upload Brand Guideline PDF
- Upload Reference Image
- Manage Brand Fonts
- Manage Brand Colors
- Manage Brand Style

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| Brand Colors | Array | Brand color palette (hex codes) |
| Brand Style Description | Text | Brand style guidelines |
| Reference Images | Array | Reference images for AI generation |
| Guideline PDF | File | Brand guideline document |
| Logo | File | Client logo |
| Brand Fonts | Array | Brand fonts for design generation |

**Brand Fonts Fields:**

| Field | Type | Description |
|-------|------|-------------|
| Font Name | String | Primary/secondary font name (e.g. "Montserrat", "Playfair Display") |
| Font File | File | Optional OTF/TTF file upload for custom fonts |

---

### Module 5 - Campaign Management

**Features:**
- Create Campaign
- Edit Campaign
- Delete Campaign

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| Campaign Name | String | Campaign title |
| Description | Text | Campaign details |
| Start Date | Date | Campaign start date |
| End Date | Date | Campaign end date |
| Client | Reference | Linked client |

---

### Module 6 - Content Calendar

**Content Types:**

| Type | Description |
|------|-------------|
| Instagram Feed | Single image post |
| Instagram Story | Vertical story format |
| Instagram Carousel | Multiple images swipe |

**Status Flow:**

```
Draft → In Progress → Generated → In Review → Approved → Published
```

| Status | Description |
|--------|-------------|
| Draft | Initial state |
| In Content | Being worked on |
| Generated | AI-generated design ready |
| In Review | Submitted for approval |
| Approved | Approved by reviewer |
| Published | Live on platform |

---

### Module 7 - AI Design Generator

#### Single Design

**Input:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Client | Reference | Target client |
| Content Type | Enum | Feed/Story/Carousel |
| Prompt | Text | Design description |
| Upload Images | Array | Additional reference images for design context (optional) |

**Output:**

| Format | Description |
|--------|-------------|
| JPG | Compressed image |
| PNG | High-quality image |

#### Carousel Design

**Input:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Client | Reference | Target client |
| Campaign | Reference | Linked campaign |
| Number of Slides | Integer | Total carousel slides |
| Prompt per Slide | Array | Individual slide prompts |
| Upload Images | Array | Additional reference images for design context (optional) |

**Output:**

| Output | Description |
|--------|-------------|
| Multiple Images | Individual slide images |

#### AI Brand Memory

System automatically injects:

- Brand Colors
- Logo
- Style Description
- Guideline Context
- Reference Images
- Brand Fonts

...into generation prompts.

**Upload Images Feature:**

Users can upload additional images during generation to provide extra visual context. These images are:

- Temporarily stored during generation
- Used as visual reference alongside brand assets
- Not stored permanently unless saved by user

---

### Module 8 - Approval Workflow

**Flow:**

```
Draft
   ↓
In Review
   ↓
Approved OR Revision Needed
```

**Features:**
- Submit for Review
- Approve
- Request Revision
- Comment

---

### Module 9 - Design History

**Features:**
- View Generated Images
- View Prompt History
- View Versions
- Reuse Prompt

---

## Credit System

**Rule:** 1 Credit = 1 Generated Image

| Action | Credits |
|--------|---------|
| New generation | 1 |
| Regeneration | 1 |
| Carousel (per image) | 1 |

### Pricing Plans

| Plan | Clients | Credits | Price |
|------|---------|---------|-------|
| Freelancer | 3 | 200 | - |
| Agency Starter | 20 | 1.000 | - |
| Agency Pro | Unlimited | 3.000 | - |

---

## Future Scope

| Feature | Description |
|---------|-------------|
| Client Review Portal | External review interface for clients |
| AI Caption Generator | Auto-generate social media captions |
| AI Copywriting | AI-powered content writing |
| AI Hashtag Generator | Relevant hashtag suggestions |
| Reporting Dashboard | Analytics and performance metrics |
| Ads Integration | Connect with ad platforms |
| AI Insights | AI-powered analytics insights |
| Auto Reporting | Automated report generation |

---

## Technical Considerations

### Recommended Tech Stack

**Frontend:**
- React.js / Next.js
- Tailwind CSS
- TypeScript

**Backend:**
- Node.js / Express.js or NestJS
- PostgreSQL (Database)
- Redis (Caching)

**AI Integration:**
- OpenAI DALL-E / Midjourney API / Stable Diffusion
- Prompt engineering for brand consistency

**Storage:**
- AWS S3 / Cloudflare R2 (File storage)

**Authentication:**
- JWT + Refresh Token
- OAuth2 (Google, GitHub)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway / Backend                  │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Auth       │  │   AI Engine  │  │   Storage    │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  AI API      │  │  S3 / R2     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## API Endpoints Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password |

### Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/organizations | Create organization |
| GET | /api/organizations/:id | Get organization |
| PUT | /api/organizations/:id | Update organization |
| POST | /api/organizations/:id/invite | Invite member |
| PUT | /api/organizations/:id/members/:userId | Update member role |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/clients | Create client |
| GET | /api/clients | List clients |
| GET | /api/clients/:id | Get client |
| PUT | /api/clients/:id | Update client |
| DELETE | /api/clients/:id | Delete client |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/clients/:id/assets/logo | Upload logo |
| POST | /api/clients/:id/assets/guideline | Upload guideline |
| POST | /api/clients/:id/assets/references | Upload reference |
| POST | /api/clients/:id/assets/fonts | Add brand font |
| DELETE | /api/clients/:id/assets/fonts/:fontId | Remove brand font |
| PUT | /api/clients/:id/assets/colors | Update brand colors |
| PUT | /api/clients/:id/assets/style | Update brand style |

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns | List campaigns |
| GET | /api/campaigns/:id | Get campaign |
| PUT | /api/campaigns/:id | Update campaign |
| DELETE | /api/campaigns/:id | Delete campaign |

### Content Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/calendar | Create content |
| GET | /api/calendar | List content |
| GET | /api/calendar/:id | Get content |
| PUT | /api/calendar/:id | Update content |
| DELETE | /api/calendar/:id | Delete content |

### AI Generator

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/generate/single | Generate single design |
| POST | /api/generate/carousel | Generate carousel |
| GET | /api/generate/history | Get generation history |

### Approval

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/approvals/:id/submit | Submit for review |
| POST | /api/approvals/:id/approve | Approve |
| POST | /api/approvals/:id/revision | Request revision |
| POST | /api/approvals/:id/comment | Add comment |

---

## Database Schema (High Level)

### users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email |
| name | String | Full name |
| password_hash | String | Hashed password |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

### organizations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Organization name |
| owner_id | UUID | FK to users |
| created_at | Timestamp | Creation date |

### organization_members

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| user_id | UUID | FK to users |
| role | Enum | owner/admin/designer |
| joined_at | Timestamp | Join date |

### clients

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| name | String | Client name |
| description | Text | Description |
| status | Enum | active/inactive |
| created_at | Timestamp | Creation date |

### client_assets

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK to clients |
| type | Enum | logo/guideline/reference/font |
| file_url | String | GCS file URL |
| brand_colors | JSON | Color palette |
| brand_style | Text | Style description |
| font_name | String | Font name (for font type) |
| font_type | Enum | primary/secondary/accent (for font type) |
| created_at | Timestamp | Creation date |

### campaigns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK to clients |
| name | String | Campaign name |
| description | Text | Description |
| start_date | Date | Start date |
| end_date | Date | End date |
| created_at | Timestamp | Creation date |

### content_calendar

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| campaign_id | UUID | FK to campaigns |
| content_type | Enum | feed/story/carousel |
| status | Enum | draft/in_progress/generated/in_review/approved/published |
| scheduled_date | Date | Publication date |
| prompt | Text | Generation prompt |
| created_at | Timestamp | Creation date |

### generated_designs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content_id | UUID | FK to content_calendar |
| image_url | String | Generated image URL |
| prompt_used | Text | Full prompt with brand context |
| version | Integer | Version number |
| credits_used | Integer | Credits consumed |
| created_at | Timestamp | Creation date |

### generation_upload_images

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| design_request_id | UUID | FK to generated_designs |
| image_url | String | GCS temporary file URL |
| original_name | String | Original filename |
| created_at | Timestamp | Upload date |

### approvals

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content_id | UUID | FK to content_calendar |
| status | Enum | pending/approved/revision_needed |
| reviewer_id | UUID | FK to users |
| comment | Text | Review comment |
| created_at | Timestamp | Creation date |

### credits

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| balance | Integer | Remaining credits |
| used | Integer | Used credits |
| plan | Enum | freelancer/starter/pro |
| updated_at | Timestamp | Last update |

---

## Milestones

### Phase 1 - Foundation (Week 1-4)

- [ ] Authentication system
- [ ] Organization management
- [ ] Basic UI framework
- [ ] Database setup

### Phase 2 - Client & Assets (Week 5-8)

- [ ] Client management
- [ ] Asset library
- [ ] File upload system
- [ ] Brand color/style management

### Phase 3 - Campaign & Calendar (Week 9-12)

- [ ] Campaign management
- [ ] Content calendar
- [ ] Status workflow
- [ ] Basic dashboard

### Phase 4 - AI Integration (Week 13-16)

- [ ] AI design generator (single)
- [ ] AI design generator (carousel)
- [ ] Brand memory integration
- [ ] Credit system

### Phase 5 - Approval & Polish (Week 17-20)

- [ ] Approval workflow
- [ ] Design history
- [ ] Comments system
- [ ] UI/UX polish

### Phase 6 - Launch (Week 21-24)

- [ ] Testing & QA
- [ ] Performance optimization
- [ ] Documentation
- [ ] Beta launch

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| Brand Memory | AI system that automatically includes brand assets in design generation |
| Credit | Unit of measurement for AI generation (1 credit = 1 image) |
| Content Calendar | Schedule for planned social media content |
| Campaign | Group of related content for a specific marketing initiative |

---

**Document Version:** 1.0
**Last Updated:** July 22, 2026
**Author:** Product Team
