# AI Brand Workspace for Agencies

## System Design Overview

This document defines the technical architecture and engineering principles for the MVP.

---

# Architecture Style

**Modular Monolith**

Reason:

- Faster MVP delivery
- Easier maintenance
- Lower operational cost
- Simpler deployment

Microservices are intentionally excluded.

---

# Tech Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type safety |
| App Router | File-based routing |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui | UI component library |
| TanStack Query | Server state management |

## Backend

| Technology | Purpose |
|------------|---------|
| FastAPI | Python web framework |
| Python 3.12+ | Runtime |
| SQLAlchemy | ORM |
| Alembic | Database migrations |
| Pydantic | Data validation |

## Database

**PostgreSQL** - Hosted on Cloud SQL

## Storage

**Google Cloud Storage**

Stores:

- Logos
- Guidelines
- Reference Images
- Generated Images
- Brand Fonts (OTF/TTF files)

## AI Layer

**OpenAI Image Generation API**

Responsibilities:

- Generate Feed
- Generate Story
- Generate Carousel

## Infrastructure

**Google Cloud Run** - Containerized using Docker

---

# High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│                      (Next.js 15)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│                    (Python 3.12+)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │ Google Cloud    │  │   OpenAI API    │
│   (Cloud SQL)   │  │    Storage      │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

# Core Domain Modules

## 1. Auth Module

**Responsibilities:**

- Authentication
- Authorization
- JWT Management

**Tables:**

| Table | Description |
|-------|-------------|
| users | User accounts and credentials |

**Note:** Public registration is disabled. Users are created via invitation flow.

---

## 2. Organization Module

**Responsibilities:**

- Team Management
- Role Management
- Invitation Management

**Tables:**

| Table | Description |
|-------|-------------|
| organizations | Organization records |
| team_members | Team membership and roles |
| invitations | Pending invitations |

**Invitation Flow:**
1. Superadmin or Admin creates invitation with email and role
2. System generates unique token and stores invitation
3. User receives email with invitation link
4. User sets password via invitation link
5. User account is created and added to organization as Admin or Designer

**Role Model:**
- Superadmin is system-level (`users.is_superuser = true`) and reserved for the platform operator.
- Organization users only use Admin and Designer roles.
- Owner is intentionally not exposed as an application user role.

---

## 3. Client Module

**Responsibilities:**

- Client Management

**Tables:**

| Table | Description |
|-------|-------------|
| clients | Client records per organization |

---

## 4. Brand Asset Module

**Responsibilities:**

- Asset Storage
- Brand Context
- Font Management

**Tables:**

| Table | Description |
|-------|-------------|
| brand_assets | Brand assets per client (including fonts) |

---

## 5. Campaign Module

**Responsibilities:**

- Campaign Management

**Tables:**

| Table | Description |
|-------|-------------|
| campaigns | Campaign records |

---

## 6. Content Module

**Responsibilities:**

- Content Planning
- Content Status

**Tables:**

| Table | Description |
|-------|-------------|
| content_items | Content calendar items |

---

## 7. Design Module

**Responsibilities:**

- Prompt Assembly
- Image Generation
- Design History
- Upload Images Handling

**Tables:**

| Table | Description |
|-------|-------------|
| design_requests | Generation requests with prompts |
| design_outputs | Generated image results |
| generation_upload_images | Temporary uploaded images for generation |

---

## 8. Approval Module

**Responsibilities:**

- Review Workflow
- Comments
- Approval Status

**Tables:**

| Table | Description |
|-------|-------------|
| approvals | Approval records |
| comments | Review comments |

---

# Database Entities

## users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email |
| password_hash | String | Argon2 hashed password |
| created_at | Timestamp | Creation date |

## organizations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Organization name |

## team_members

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| user_id | UUID | FK to users |
| role | Enum | owner/admin/designer |

## clients

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations |
| name | String | Client name |
| description | Text | Client description |

## brand_assets

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK to clients |
| asset_type | Enum | logo/guideline/reference/font |
| file_url | String | GCS file URL |
| font_name | String | Font name (for font assets) |
| font_type | Enum | primary/secondary/accent (for font assets) |

## campaigns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK to clients |
| name | String | Campaign name |
| start_date | Date | Start date |
| end_date | Date | End date |

## content_items

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| campaign_id | UUID | FK to campaigns |
| type | Enum | feed/story/carousel |
| status | Enum | draft/in_progress/generated/in_review/approved/published |

## design_requests

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content_item_id | UUID | FK to content_items |
| prompt | Text | User prompt + brand context |
| credit_used | Integer | Credits consumed |

## design_outputs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| request_id | UUID | FK to design_requests |
| image_url | String | GCS image URL |

## generation_upload_images

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| design_request_id | UUID | FK to design_requests |
| image_url | String | GCS temporary file URL |
| original_name | String | Original filename |
| created_at | Timestamp | Upload date |

## approvals

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content_item_id | UUID | FK to content_items |
| status | Enum | pending/approved/revision_needed |
| reviewer_id | UUID | FK to users |

## comments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content_item_id | UUID | FK to content_items |
| author_id | UUID | FK to users |
| message | Text | Comment content |

---

# AI Brand Memory Design

When a user generates a design:

**System loads:**

1. Client Profile
2. Brand Colors
3. Brand Style
4. Logo
5. Guidelines
6. Reference Images
7. Brand Fonts (Primary, Secondary, Accent)

**System builds a structured prompt:**

```
┌─────────────────────────────────────────────────────────────────┐
│                       User Prompt                               │
│                    (Design request)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Brand Context                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Colors  │ │  Style  │ │  Logo   │ │Guides   │ │ Refs    │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│  ┌─────────┐ ┌─────────────────────────────────────────────┐   │
│  │ Fonts   │ │        Upload Images (Optional)             │   │
│  └─────────┘ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Final Prompt                               │
│              (Structured with brand context)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               OpenAI Image Generation                          │
└─────────────────────────────────────────────────────────────────┘
```

> **This component is the core product differentiator.**

---

# API Structure

| Base Path | Module |
|-----------|--------|
| `/api/v1/auth` | Authentication |
| `/api/v1/organizations` | Organization management |
| `/api/v1/invitations` | Invitation management |
| `/api/v1/clients` | Client management |
| `/api/v1/assets` | Brand assets |
| `/api/v1/campaigns` | Campaign management |
| `/api/v1/content-items` | Content calendar |
| `/api/v1/designs` | Design generation |
| `/api/v1/approvals` | Approval workflow |
| `/api/v1/comments` | Comments |

---

# Security

## Authentication

| Token Type | Purpose |
|------------|---------|
| JWT Access Token | Short-lived API access |
| JWT Refresh Token | Token renewal |

## Password Hash

**Argon2** (memory-hard, resistant to GPU attacks)

## Authorization

**Role Based Access Control (RBAC)**

| Role | Permissions |
|------|-------------|
| Owner | Full access to all resources |
| Admin | Manage clients, campaigns, team |
| Designer | Create designs, view assets |

---

# Logging

| Log Type | Purpose |
|----------|---------|
| Application Logs | General system logs |
| Audit Logs | Track important actions |
| AI Generation Logs | Track AI API calls and costs |
| Credit Usage Logs | Track credit consumption |

---

# Deployment Strategy

## Environments

| Environment | Purpose |
|-------------|---------|
| Development | Local development |
| Staging | Pre-production testing |
| Production | Live environment |

## CI/CD Pipeline

```
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   GitHub    │ ───▶ │ GitHub Actions  │ ───▶ │   Cloud Run     │
│   (Source)  │      │   (CI/CD)       │      │  (Deployment)   │
└─────────────┘      └─────────────────┘      └─────────────────┘
```

---

# Non Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Availability** | 99% uptime |
| **Response Time** | < 500ms for API calls |
| **Scalability** | Up to 100 organizations |
| | Up to 50,000 generated images |
| **Security** | OWASP basic compliance |
| **Maintainability** | Clean Architecture |
| | Typed APIs |
| | Automated Migrations |

---

# MVP Guiding Principles

1. Build simple first
2. Avoid microservices
3. Avoid premature optimization
4. Prioritize agency workflow
5. Prioritize AI Brand Memory
6. Prioritize multi-client management
7. Keep operational costs low
8. Optimize for fast iteration

---

**Document Version:** 1.0
**Last Updated:** July 22, 2026
**Author:** Engineering Team
