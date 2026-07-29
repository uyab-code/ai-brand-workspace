# UI Redesign Spec — AI Brand Workspace v2.0

## Scope

**Visual refresh only** — tidak mengubah business logic, navigation, routes, database, APIs, workflow, permissions, atau features yang sudah ada.

---

## Design Tokens

### Colors

| Token | Hex | Kegunaan |
|-------|-----|----------|
| Primary | `#7C3AED` | Active states, buttons, links |
| Background | `#FAFAFA` | Page background |
| Card | `#FFFFFF` | Card/panel background |
| Border | `#E5E7EB` | Borders, dividers |
| Text | `#111827` | Primary text |
| Secondary Text | `#6B7280` | Labels, descriptions |

### Typography

- **Font**: Inter (via `next/font/google`)
- **Heading**: `text-2xl font-semibold tracking-tight`
- **Subheading**: `text-sm font-semibold`
- **Body**: `text-sm`
- **Small**: `text-xs`
- **Label**: `text-sm font-medium`

### Border Radius

- Cards: `rounded-xl` (12px)
- Buttons / Inputs: `rounded-[10px]` (10px)
- Badges: `rounded-full`
- Dialog / Modal: `rounded-2xl` (16px)
- Sidebar nav items: `rounded-xl`

### Spacing

- Page padding: `p-6 lg:p-8`
- Section gap: `space-y-6`
- Card padding: `p-6`
- Table cell: `px-4 py-3`
- Input height: `h-10`

---

## Component Specs

### Sidebar

| Property | Value |
|----------|-------|
| Width | 272px fixed |
| Background | `bg-card` (white) |
| Border | `border-r border-border` |
| Logo area | h-16, border-b, px-5 |
| Nav items | h-10, px-3, rounded-xl |
| Active item | `bg-primary text-primary-foreground shadow-sm` |
| Inactive item | `text-muted-foreground hover:bg-muted` |
| Icons | Lucide, h-4 w-4 |
| Footer | border-t, logout button |

### Navbar (Topbar)

| Property | Value |
|----------|-------|
| Height | h-16 |
| Background | `bg-card` |
| Border | `border-b border-border` |
| Search | max-w-[420px], rounded-[10px], bg-background |
| Profile | Avatar + name + ChevronDown |
| Notification | Bell icon, rounded-[10px] button |

### Tables

| Property | Value |
|----------|-------|
| Header row | `bg-background`, border-b |
| Header text | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |
| Row height | ~76px |
| Row hover | `hover:bg-background/80 transition-colors` |
| Cell padding | `px-4 py-3` |
| Border | `border-b border-border` |

### Status Badges

| Status | Background | Text |
|--------|------------|------|
| Draft | `bg-muted` | `text-muted-foreground` |
| In Progress | `bg-blue-50` | `text-blue-700` |
| In Review | `bg-yellow-50` | `text-yellow-700` |
| Approved | `bg-green-50` | `text-green-700` |
| Published | `bg-accent` | `text-primary` |

Badge: `rounded-full px-2.5 py-0.5 text-xs font-medium`

### Buttons

| Variant | Style |
|---------|-------|
| Default (Primary) | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Outline | `border border-input bg-background hover:bg-accent` |
| Ghost | `hover:bg-accent hover:text-accent-foreground` |
| Danger | `bg-destructive text-destructive-foreground` |

Sizes: `h-10 px-4` (default), `h-9 px-3` (sm), `h-11 px-8` (lg)

### Cards

```
rounded-xl border border-border bg-card text-card-foreground shadow-sm
```

### Forms

| Element | Style |
|---------|-------|
| Input | `h-10 rounded-[10px] border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring` |
| Select | Same as input |
| Textarea | `min-h-[96px] rounded-[10px] border border-input bg-card px-3 py-2 text-sm` |
| Label | `text-sm font-medium` |

### Empty State

- Dashed border: `border-dashed border-border`
- Background: `bg-card`
- Icon, title, description, optional action button

---

## Pages to Redesign

### 1. Dashboard (`/dashboard`)
- KPI cards: clean white cards, no gradients
- Recent Designs: thumbnail grid
- Upcoming Briefs: list with StatusBadge

### 2. Clients (`/dashboard/clients`)
- Card grid with client info
- Empty state with icon

### 3. Client Detail (`/dashboard/clients/[id]`)
- 2-column grid: Client Info + Brand Assets
- Upload components, color swatches, font list

### 4. Content Library (`/dashboard/content-briefs`)
- Search input only (by name)
- Table with columns: Name, Type, Platform, Created, Deadline, Status
- Row click to detail
- Create form with slides

### 5. Content Brief Detail (`/dashboard/content-briefs/[id]`)
- Brief info card
- Slides list with inline edit
- Per-slide AI generate section

### 6. Admin Dashboard (`/dashboard/admin`)
- Stats cards with icons
- Organizations table

### 7. Team Settings (`/dashboard/settings/team`)
- Invite form
- Members list

### 8. Design Detail (`/dashboard/designs/[id]`)
- Image preview
- Metadata card
- Prompt display

---

## Existing Reusable Components

| Component | File | Status |
|-----------|------|--------|
| `PageHeader` | `components/ui/page-header.tsx` | ✅ Siap pakai |
| `SearchInput` | `components/ui/search-input.tsx` | ✅ Siap pakai |
| `EmptyState` | `components/ui/empty-state.tsx` | ✅ Siap pakai |
| `Badge` | `components/ui/badge.tsx` | ✅ Siap pakai |
| `StatusBadge` | `components/ui/status-badge.tsx` | ✅ Siap pakai |
| `Button` | `components/ui/button.tsx` | ✅ Siap pakai |
| `Card` | `components/ui/card.tsx` | ✅ Siap pakai |
| `Input` | `components/ui/input.tsx` | ✅ Siap pakai |
| `Label` | `components/ui/label.tsx` | ✅ Siap pakai |
| `Select` | `components/ui/select.tsx` | ✅ Siap pakai |
| `Textarea` | `components/ui/textarea.tsx` | ✅ Siap pakai |
| `Avatar` | `components/ui/avatar.tsx` | ✅ Siap pakai |
| `DropdownMenu` | `components/ui/dropdown-menu.tsx` | ✅ Siap pakai |
| `Table` | `components/ui/table.tsx` | ✅ Siap pakai |
| `Toast` | `components/ui/toast.tsx` | ✅ Siap pakai |

---

## Execution Plan

### Stage 1: Foundation Check
- [ ] Verifikasi `globals.css` tokens
- [ ] Verifikasi `tailwind.config.ts` colors
- [ ] Verifikasi `layout.tsx` Inter font
- [ ] Build test

### Stage 2: App Shell
- [ ] Sidebar — Lucide icons, active state, spacing
- [ ] Navbar — search, notifications, profile dropdown
- [ ] Dashboard layout — bg-background, padding

### Stage 3: Existing Pages
- [ ] Dashboard page — KPI cards, recent designs, upcoming
- [ ] Clients page — card grid, empty state
- [ ] Client detail — 2-col layout, assets, forms
- [ ] Content Library — table, search, status badges
- [ ] Content Brief detail — slides, generate section
- [ ] Admin page — stats, org table
- [ ] Team page — invite, members
- [ ] Design detail — image, metadata, prompt

### Stage 4: Verify
- [ ] `npm run build` — no errors
- [ ] Manual check: all pages render correctly
- [ ] Manual check: all existing functionality works

---

## Rules

- ✅ Ubah visual appearance saja
- ✅ Improve spacing, typography, consistency
- ✅ Pakai reusable components yang sudah ada
- ✅ Desktop first, responsive
- ❌ Jangan tambah halaman baru
- ❌ Jangan ubah business logic
- ❌ Jangan ubah routes / navigation
- ❌ Jangan ubah API / database
- ❌ Jangan ubah workflow / permissions
