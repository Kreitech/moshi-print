# Architecture — MoshiPrint
_Last updated: 2026-05-08_

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components + Server Actions |
| Language | TypeScript 5 (strict) | |
| UI | React 18 + shadcn/ui + Tailwind CSS 3 | |
| Auth | Supabase Auth | Email/password + magic link |
| Database | Supabase Postgres 15 | Hosted, with RLS enabled |
| ORM | Prisma 5 | Schema definition + migrations only — NOT used for app queries |
| Data access | Supabase SSR client (`@supabase/ssr`) | All app reads/writes — RLS enforced via JWT |
| Hosting | Vercel | App + edge middleware |
| File storage | Google Drive | Manual link entry (MVP); direct upload deferred |
| Version control | GitHub | git@github.com:Kreitech/moshi-print.git |

> **Important:** The HIVE project config (`AGENTS.local.md`) lists stack `node-react-prisma`. The actual stack is Next.js + Supabase. Update `AGENTS.local.md` in the first ticket (MP-01).

---

## Bounded Contexts

| Context | Responsibility | Key Entities |
|---|---|---|
| **Identity & Access** | Auth, tenants, membership, roles | `tenants`, `tenant_members` |
| **Order Management** | Order lifecycle, customers, status workflow | `orders`, `customers` |
| **File References** | File metadata linked to any entity | `files` |
| **Model Library** | 3D model catalog, versions, source/license | `models`, `model_versions`, `order_model_options` |
| **Production** | Print jobs, attempts, printers, materials, profiles | `print_jobs`, `print_attempts`, `printers`, `materials`, `print_profiles` |
| **Dashboard** | Aggregated read-only views | (queries across Order Management + Production) |

---

## Module Structure

```
moshi-print/
├── src/
│   ├── app/                          ← Next.js App Router
│   │   ├── (auth)/                   ← Unauthenticated layout
│   │   │   ├── login/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   ├── (app)/                    ← Authenticated layout (sidebar + nav)
│   │   │   ├── layout.tsx            ← Resolves tenant context; redirects if none
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          ← List
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx     ← Detail
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx          ← List with filters
│   │   │   │   ├── board/page.tsx    ← Kanban
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx     ← Detail
│   │   │   ├── models/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── versions/new/page.tsx
│   │   │   ├── print-jobs/
│   │   │   │   └── [id]/page.tsx
│   │   │   └── settings/
│   │   │       ├── layout.tsx        ← Admin/owner gate
│   │   │       ├── printers/page.tsx
│   │   │       ├── materials/page.tsx
│   │   │       ├── profiles/page.tsx
│   │   │       └── team/page.tsx
│   │   └── api/                      ← Route handlers (future webhooks)
│   │
│   ├── components/
│   │   ├── ui/                       ← shadcn/ui primitives (Button, Card, etc.)
│   │   └── features/
│   │       ├── orders/               ← OrderCard, OrderStatusBadge, OrderForm, etc.
│   │       ├── customers/
│   │       ├── models/
│   │       ├── print-jobs/           ← PrintJobCard, AttemptForm, AttemptCard, etc.
│   │       ├── files/                ← FileList, FileReferenceForm
│   │       └── settings/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             ← createBrowserClient (for client components)
│   │   │   └── server.ts             ← createServerClient (for server components + actions)
│   │   ├── actions/                  ← Next.js server actions (one file per context)
│   │   │   ├── auth.ts
│   │   │   ├── tenants.ts
│   │   │   ├── customers.ts
│   │   │   ├── orders.ts
│   │   │   ├── models.ts
│   │   │   ├── print-jobs.ts
│   │   │   └── files.ts
│   │   ├── order-transitions.ts      ← Allowed state machine transitions (plain object)
│   │   └── validations/              ← Zod schemas matching DB shapes
│   │       ├── order.ts
│   │       ├── customer.ts
│   │       ├── model.ts
│   │       └── print-job.ts
│   │
│   ├── types/
│   │   └── database.ts               ← Generated from Supabase (supabase gen types)
│   │
│   ├── hooks/                        ← Client-only hooks (optimistic UI, etc.)
│   │
│   └── constants/
│       ├── routes.ts                 ← Typed route constants
│       ├── enums.ts                  ← Order statuses, file types, roles, etc.
│       └── config.ts                 ← API URLs, pagination limits
│
├── prisma/
│   └── schema.prisma                 ← Schema definition + migration history
│
├── supabase/
│   └── migrations/                   ← RLS policy SQL files (applied alongside Prisma)
│
└── middleware.ts                     ← Session refresh + auth guard + tenant resolution
```

---

## Key Architectural Decisions

### ADR-01: Supabase client for all application queries — never Prisma

**Decision:** All application reads and writes go through `@supabase/ssr` server client. Prisma is used exclusively for `prisma migrate dev` and seed scripts.

**Reason:** Prisma queries bypass Supabase RLS entirely (they use the service role or a direct connection). Using the Supabase client ensures `auth.uid()` is available in every query and RLS policies enforce tenant isolation automatically. Rebuilding RLS in application code is error-prone and a security risk.

**Constraint:** Never import `PrismaClient` in any file under `src/app/` or `src/lib/actions/`. Only allowed in `prisma/seed.ts` and migration scripts.

---

### ADR-02: Order status transitions are validated server-side via a state machine constant

**Decision:** A plain object in `lib/order-transitions.ts` defines the full allowed transition graph. Every server action that changes an order status validates against this map before writing to DB.

**Allowed transitions:**
```
new              → researching | ready_for_factory | cancelled
researching      → pending_approval | ready_for_factory | cancelled
pending_approval → ready_for_factory | researching | cancelled
ready_for_factory → printing (via print job going running) | cancelled
printing         → post_processing | failed_or_reprint
post_processing  → ready_to_deliver
ready_to_deliver → delivered
failed_or_reprint → ready_for_factory (retry)
delivered        → (terminal)
cancelled        → (terminal)
```

**Note:** `ready_for_factory → printing` is not triggered by a direct order action — it is triggered when a linked print job transitions to `running`.

---

### ADR-03: Print job status drives order status (not the reverse)

**Decision:** Creating a print job does not change order status. The order moves to `printing` only when a print job is explicitly marked as `running`. This decouples job planning from production start.

**State coupling:**
- Print job `pending → running` → Order `ready_for_factory → printing`
- Print job `running → completed` → Order `printing → post_processing`
- Print job `running → failed` → Order `printing → failed_or_reprint`

---

### ADR-04: Print profiles use a single flat table with nullable type-specific columns

**Decision:** FDM and resin settings are stored as nullable columns in `print_profiles`. No polymorphic split or JSON blob.

**Reason:** The number of fields is small (< 10 per type), queries are simple, and a flat table is easier to migrate. The form conditionally renders FDM or resin fields based on the linked printer's `type`. All type-specific columns are nullable; validation enforced in the application layer.

---

### ADR-05: File records are polymorphic via entity_type + entity_id

**Decision:** A single `files` table stores metadata for files attached to any entity using `entity_type` (string enum) + `entity_id` (uuid).

**Reason:** Avoids 6+ separate file join tables. The set of entity types is closed and small. RLS policy uses `tenant_id` (not entity join) so no RLS complexity from polymorphism.

**MVP:** Users paste a Google Drive URL manually. The `files` record stores the URL and metadata. No server-side upload in MVP.

---

### ADR-06: Tenant context resolved in (app) layout, not per-page

**Decision:** The authenticated layout (`(app)/layout.tsx`) resolves the active tenant once per request via a server-side helper. All child server components receive tenant context via React's async server component tree (passed as props or via a shared server utility).

**Reason:** Avoids redundant tenant lookups on every page. Centralizes the redirect to `/onboarding` if no tenant is found.

---

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  ┌──────────────┐   Server Action / fetch            │
│  │ Client Comp  │ ─────────────────────────────────► │
│  └──────────────┘                                   │
│  ┌──────────────┐   RSC payload (HTML + data)        │
│  │ Server Comp  │ ◄─────────────────────────────────  │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Next.js Server          │
│  middleware.ts           │  ← Refreshes session; redirects unauthed
│  (app)/layout.tsx        │  ← Resolves tenant_id; redirects to /onboarding
│  Server Actions          │  ← Validate input (Zod) → transition guard → Supabase write
│  Server Components       │  ← Supabase read (RLS enforced)
└─────────────────────────┘
         │  Supabase SSR client (JWT context)
         ▼
┌─────────────────────────┐
│  Supabase Postgres       │
│  RLS policies active     │  ← auth.uid() → tenant_members → tenant_id check
│  All tables tenant-scoped│
└─────────────────────────┘
```

---

## External Dependencies

| Dependency | Purpose | Integration method |
|---|---|---|
| Supabase Auth | User authentication | `@supabase/ssr` + middleware session refresh |
| Supabase Postgres | Primary database | `@supabase/ssr` server client (RLS enforced) |
| Prisma | Schema definition + migrations | CLI only (`prisma migrate dev`, `prisma db seed`) |
| Google Drive | File storage (MVP: manual link entry) | User pastes GDrive URL; no API calls in MVP |
| Vercel | App hosting + edge middleware | `next build` + Vercel project deploy |
| GitHub | Version control | Standard git remote |

---

## Constraints

These are hard rules that must not be broken without an explicit ADR update:

1. **Every tenant-scoped table MUST have a `tenant_id uuid NOT NULL` column.** No exceptions.
2. **Never use `PrismaClient` in application code** (`src/app/`, `src/lib/actions/`, `src/components/`). Prisma is for migrations only.
3. **Never expose the Supabase `service_role` key to the browser.** It bypasses RLS. Only use in server-only contexts (`lib/actions/`, seed scripts) and only when absolutely necessary (e.g., tenant creation in onboarding).
4. **Print attempt records are immutable.** No UPDATE or DELETE on `print_attempts` after insert.
5. **Order status transitions must be validated against the state machine in `lib/order-transitions.ts`** before any DB write. Reject invalid transitions with a 400.
6. **UI language is Spanish.** All user-visible strings (labels, buttons, error messages, empty states) must be in Spanish. Code, types, DB columns, and comments remain in English.
7. **`tenant_id` is always set from the server session** — never trusted from client input.
