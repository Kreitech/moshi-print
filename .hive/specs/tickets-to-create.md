# MoshiPrint — Tickets to Create
_Generated: 2026-05-08 | Board: https://github.com/Kreitech/moshi-print/issues_

## Labels to create first

```
epic: foundation       #6366f1
epic: customers        #06b6d4
epic: orders           #f59e0b
epic: files            #84cc16
epic: model-library    #ec4899
epic: production-setup #8b5cf6
epic: print-jobs       #ef4444
epic: dashboard        #14b8a6

sprint: 1              #e2e8f0
sprint: 2              #e2e8f0
sprint: 3              #e2e8f0
sprint: 4              #e2e8f0

size: S                #d1fae5
size: M                #fef3c7
size: L                #fee2e2

status: backlog        #f1f5f9
```

---

## Sprint 1 — Foundation + Customers

---

### MP-01 · Initialize Next.js app with Supabase, Tailwind, shadcn/ui

**Labels:** `epic: foundation` `sprint: 1` `size: M`

**Goal**
Bootstrap the Next.js 14 App Router project with Supabase SSR client, Tailwind CSS, and shadcn/ui installed and verified. Update AGENTS.local.md to reflect the actual stack.

**Acceptance Criteria**
- `npm run dev` starts without errors
- Supabase browser client importable from `@/lib/supabase/client`
- Supabase server client importable from `@/lib/supabase/server`
- shadcn/ui `Button` and `Card` render on a test page
- `.env.local` values documented in `.env.example` (no secrets committed)
- `/` redirects to `/login` when unauthenticated
- `AGENTS.local.md` stack updated from `node-react-prisma` to `nextjs-supabase`

**Technical Notes**
- Use `create-next-app` with TypeScript + Tailwind
- Install `@supabase/ssr`, `@supabase/supabase-js`
- Configure `middleware.ts` for session refresh (Supabase SSR pattern)
- Do not install or configure Prisma in this ticket

**Dependencies**
- Supabase project must exist (SUPABASE_URL + SUPABASE_ANON_KEY available)

**Test Cases**
- App loads at localhost:3000
- Navigating to `/orders` while unauthenticated redirects to `/login`

---

### MP-02 · Supabase Auth — login page

**Labels:** `epic: foundation` `sprint: 1` `size: S`

**Goal**
Users can log in with email/password or receive a magic link. Successful login redirects to `/dashboard`.

**Acceptance Criteria**
- `/login` renders email + password form and "Enviar enlace mágico" option
- Successful email/password login → redirect to `/dashboard`
- Magic link email sent and login via link works
- Failed login shows Spanish error: "Correo o contraseña incorrectos"
- Already-authenticated user visiting `/login` is redirected to `/dashboard`

**Technical Notes**
- Use `supabase.auth.signInWithPassword` and `supabase.auth.signInWithOtp`
- Handle session via `middleware.ts` cookie refresh (already set up in MP-01)
- No custom token handling — rely fully on Supabase Auth

**Dependencies**
- MP-01

**Test Cases**
- Valid credentials → `/dashboard`
- Invalid credentials → error message shown
- Magic link flow → authenticated session
- Authenticated user → `/dashboard` skips login

---

### MP-03 · DB schema — tenants + tenant_members + roles

**Labels:** `epic: foundation` `sprint: 1` `size: M`

**Goal**
Core multitenancy tables in Supabase via Prisma migration. Seed creates the Moshicrea tenant with Rafa as owner.

**Acceptance Criteria**
- `tenants` table: `id uuid pk default gen_random_uuid(), name text, slug text unique, created_at timestamptz`
- `tenant_members` table: `id uuid pk, tenant_id uuid fk tenants, user_id uuid (maps to auth.uid()), role text check (owner|admin|operator|sales), created_at timestamptz`
- `role` implemented as Postgres CHECK constraint (not enum) for easier future changes
- `npx prisma migrate dev` runs cleanly
- Seed script: creates tenant "Moshicrea" (slug: moshicrea) + inserts Rafa's user_id as `owner`
- Prisma schema and Supabase DB are in sync

**Technical Notes**
- Set up Prisma with `DATABASE_URL` pointing to Supabase direct connection string
- Prisma is for schema + migrations only — no PrismaClient usage in app code
- Seed uses a hardcoded Rafa user_id from env var `SEED_OWNER_USER_ID`

**Dependencies**
- MP-01, Supabase project with direct DB connection string

**Test Cases**
- `SELECT * FROM tenants` returns 1 row (Moshicrea)
- `SELECT * FROM tenant_members` returns 1 row (Rafa as owner)
- Migration idempotent on re-run

---

### MP-04 · RLS policies — tenants + tenant_members

**Labels:** `epic: foundation` `sprint: 1` `size: S`

**Goal**
Row Level Security enabled on `tenants` and `tenant_members`. Users can only read tenants they belong to.

**Acceptance Criteria**
- RLS enabled on `tenants` and `tenant_members`
- SELECT policy on `tenants`: user sees only tenants where they appear in `tenant_members`
- SELECT policy on `tenant_members`: user sees only rows where `user_id = auth.uid()` or same tenant
- INSERT on `tenant_members` restricted to `owner`/`admin` of the target tenant
- Policies written in a Prisma migration SQL file or `supabase/migrations/*.sql`

**Technical Notes**
- Pattern: `USING (tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()))`
- Test with two separate Supabase Auth users in different tenants
- Use `supabase gen types typescript` after migration to regenerate `src/types/database.ts`

**Dependencies**
- MP-03

**Test Cases**
- User A cannot SELECT User B's tenant
- User A cannot SELECT User B's tenant_members rows
- Owner can add a new member; non-owner cannot

---

### MP-05 · Tenant onboarding — create workspace on first login

**Labels:** `epic: foundation` `sprint: 1` `size: M`

**Goal**
A new user with no tenant membership is redirected to `/onboarding` and can create a workspace, becoming its owner.

**Acceptance Criteria**
- After login, middleware (or `(app)/layout.tsx`) checks `tenant_members` for the current user
- No membership found → redirect to `/onboarding`
- `/onboarding` shows "Crear tu espacio de trabajo" form with a workspace name field
- Submit: creates `tenants` row + `tenant_members` row with role `owner` → redirect to `/dashboard`
- If user already has a tenant, `/onboarding` redirects to `/dashboard`
- Workspace name is required; slug auto-generated from name (lowercase, hyphens)

**Technical Notes**
- Tenant + member creation uses Supabase service role key server-side only (one place where RLS is bypassed, explicitly documented)
- Keep service role key in a server action, never in client code
- After creation, set `active_tenant_id` cookie for subsequent requests

**Dependencies**
- MP-04

**Test Cases**
- New user → onboarding → creates workspace → dashboard
- Existing tenant member → skips onboarding
- Duplicate slug → auto-append suffix (slug: moshicrea-2)

---

### MP-06 · Auth middleware — protect routes + tenant context

**Labels:** `epic: foundation` `sprint: 1` `size: S`

**Goal**
All `/` sub-routes are protected. The active tenant is resolved per-request and available to all server components without prop drilling.

**Acceptance Criteria**
- `middleware.ts` refreshes Supabase session on every request
- Unauthenticated requests to `/(app)/*` routes redirect to `/login`
- `getActiveTenant(supabase)` server utility returns the user's active `tenants` row
- `(app)/layout.tsx` calls `getActiveTenant` and redirects to `/onboarding` if null
- Tenant context available in all server components via the layout

**Technical Notes**
- Use Supabase `createServerClient` from `@supabase/ssr` with Next.js cookie methods
- `getActiveTenant` selects first `tenant_members` row for `auth.uid()` — single-tenant MVP assumption
- Do not store tenant_id in JWT claims for MVP; resolve from DB each request

**Dependencies**
- MP-05

**Test Cases**
- Logged-in user → sees protected routes
- Unauthenticated → redirect to `/login`
- User with no tenant → redirect to `/onboarding`

---

### MP-07 · DB schema — customers + RLS

**Labels:** `epic: customers` `sprint: 1` `size: S`

**Goal**
`customers` table with tenant isolation.

**Acceptance Criteria**
- `customers`: `id, tenant_id, name text not null, email, phone, notes, created_by uuid, created_at, updated_at`
- RLS: users CRUD only customers in their tenant
- Migration runs cleanly

**Dependencies**
- MP-04

**Test Cases**
- User in Tenant A cannot read Tenant B customers

---

### MP-08 · Customer list page + create form

**Labels:** `epic: customers` `sprint: 1` `size: S`

**Goal**
Sales user can view all customers and create a new one.

**Acceptance Criteria**
- `/customers` lists all tenant customers (name, email, phone) with a search input
- Search filters by name (client-side for MVP — list is small)
- "Nuevo Cliente" button opens `/customers/new`
- Create form: name (required), email, phone, notes
- Submit → create customer → redirect to `/customers/[id]`
- Empty state: "Aún no hay clientes. Crea el primero."

**Technical Notes**
- Server component for list; server action for create
- Use shadcn `Table` for list, `Form` + React Hook Form for create
- Validate with Zod: name min 2 chars

**Dependencies**
- MP-06, MP-07

**Test Cases**
- Create customer with only name → success
- Missing name → validation error shown
- Created customer appears in list

---

### MP-09 · Customer detail page

**Labels:** `epic: customers` `sprint: 1` `size: S`

**Goal**
View and edit a customer's details plus their order history.

**Acceptance Criteria**
- `/customers/[id]` shows: name, email, phone, notes, "Editar" button
- Edit opens an inline edit form (or modal)
- Lists the customer's orders: title, status badge, created_at — clickable
- 404 if customer belongs to a different tenant

**Dependencies**
- MP-08 (customers exist); MP-11 (orders — use empty list stub if not yet done)

**Test Cases**
- Valid customer → all fields visible
- Edit → updated values persist
- Cross-tenant ID → 404

---

## Sprint 2 — Orders + Production Setup

---

### MP-10 · DB schema — orders + order_status + RLS

**Labels:** `epic: orders` `sprint: 2` `size: M`

**Goal**
`orders` table with full status enum and optional-path state machine support.

**Acceptance Criteria**
- `orders`: `id, tenant_id, customer_id (nullable fk), title text not null, description, quantity int default 1, urgency text check (low|normal|high) default normal, status text not null default new, tags text[], notes, created_by uuid, created_at, updated_at`
- Valid statuses: `new | researching | pending_approval | ready_for_factory | printing | post_processing | ready_to_deliver | delivered | failed_or_reprint | cancelled`
- Index on `(tenant_id, status)` and `(tenant_id, created_at)`
- RLS: users CRUD only orders in their tenant
- `lib/order-transitions.ts` exports the allowed transition map (see Architecture ADR-02)

**Technical Notes**
- Status stored as `text` with CHECK constraint (not Postgres enum) for easier future additions
- `lib/order-transitions.ts` is a plain TypeScript object — no DB dependency
- Allowed transitions per ADR-02:
  ```
  new → researching | ready_for_factory | cancelled
  researching → pending_approval | ready_for_factory | cancelled
  pending_approval → ready_for_factory | researching | cancelled
  ready_for_factory → cancelled  (→ printing via print job running)
  printing → post_processing | failed_or_reprint
  post_processing → ready_to_deliver
  ready_to_deliver → delivered
  failed_or_reprint → ready_for_factory
  delivered → (terminal)
  cancelled → (terminal)
  ```

**Dependencies**
- MP-04, MP-07

**Test Cases**
- Cross-tenant order isolation
- `lib/order-transitions.ts` unit test: `new → ready_for_factory` valid; `new → printing` invalid

---

### MP-11 · Create order form

**Labels:** `epic: orders` `sprint: 2` `size: S`

**Goal**
Sales user creates an order in under 30 seconds.

**Acceptance Criteria**
- `/orders/new`: title (required), description, customer (searchable select), quantity (default 1), urgency (default normal), notes
- Submit → creates order with `status: new` → redirect to `/orders/[id]`
- Customer dropdown populated from tenant customers
- All labels and placeholders in Spanish

**Technical Notes**
- Server action: validate with Zod, insert via Supabase server client
- Customer select: fetch in server component, pass as prop to client form component

**Dependencies**
- MP-06, MP-10

**Test Cases**
- Create with only title → success, status = new
- Missing title → validation error
- Customer field optional — order saves without customer

---

### MP-12 · Order detail page

**Labels:** `epic: orders` `sprint: 2` `size: M`

**Goal**
Complete view of a single order. Stub sections for files, model options, and print jobs (filled by later tickets).

**Acceptance Criteria**
- `/orders/[id]` shows: title, status badge, customer link (if set), description, quantity, urgency, notes, created_at
- "Editar" button: inline edit for title, description, notes, quantity, urgency
- Sections visible but empty-stated: "Archivos", "Opciones de modelo", "Trabajos de impresión"
- Status badge uses color: grey (new), blue (researching), yellow (pending_approval), orange (ready_for_factory), purple (printing), teal (post_processing), green (ready_to_deliver/delivered), red (failed_or_reprint), neutral (cancelled)
- 404 for cross-tenant ID

**Dependencies**
- MP-11

**Test Cases**
- All fields render correctly
- Edit updates fields
- Unknown or cross-tenant ID → 404

---

### MP-13 · Order kanban board

**Labels:** `epic: orders` `sprint: 2` `size: M`

**Goal**
Visual production board showing all orders organized by status.

**Acceptance Criteria**
- `/orders/board` renders one column per status (all 10 statuses)
- Each card: title, customer name (or "Sin cliente"), quantity, urgency dot indicator
- Cards link to `/orders/[id]`
- Columns scroll independently; board scrolls horizontally on small screens
- Empty columns show "Sin órdenes" placeholder
- No drag-and-drop — status changes only via order detail page

**Technical Notes**
- Server component: fetch all tenant orders grouped by status in a single query
- Render columns client-side from grouped data

**Dependencies**
- MP-12

**Test Cases**
- Orders appear in correct column
- Empty columns render without errors
- 20+ orders across columns — all visible

---

### MP-14 · Order status transitions + "Enviar a fábrica" action

**Labels:** `epic: orders` `sprint: 2` `size: M`

**Goal**
Users can advance orders through the workflow. "Enviar a fábrica" is a prominent single-click action.

**Acceptance Criteria**
- Order detail shows "Enviar a fábrica" button when status is `new`, `researching`, or `pending_approval`
- Button transitions order to `ready_for_factory`
- Additional transitions shown as a "Cambiar estado" dropdown for other valid moves
- Invalid transitions rejected server-side with a Spanish error message
- Terminal statuses (`delivered`, `cancelled`) show no action buttons
- `updated_at` updated on every transition

**Technical Notes**
- Server action calls `validateTransition(currentStatus, nextStatus)` from `lib/order-transitions.ts` before DB write
- Return `{ error: 'Transición no válida' }` for invalid attempts

**Dependencies**
- MP-12

**Test Cases**
- `new → ready_for_factory` via "Enviar a fábrica" → success
- `new → printing` (invalid) → error returned
- `delivered → cancelled` (terminal) → no button shown

---

### MP-15 · Order list page with filters

**Labels:** `epic: orders` `sprint: 2` `size: S`

**Goal**
Browse and filter all orders in a table view.

**Acceptance Criteria**
- `/orders` shows a table: title, customer, status badge, urgency, quantity, created_at
- Filter by status (multi-select chips), urgency (select), date range (optional)
- Pagination: 20 per page with prev/next controls
- Sort by `created_at` descending (default)
- "Nueva Orden" button visible at top right
- Empty state: "No se encontraron órdenes con esos filtros"

**Technical Notes**
- Use URL search params for filters (shareable/bookmarkable)
- Server component reads `searchParams` and passes to Supabase query with `.in()` and `.gte()`/`.lte()`

**Dependencies**
- MP-12

**Test Cases**
- Filter by `status = new` → only new orders shown
- Filter by `urgency = high` → only high urgency shown
- Pagination: page 2 shows next 20

---

### MP-16 · DB schema — files metadata + RLS

**Labels:** `epic: files` `sprint: 2` `size: S`

**Goal**
`files` table for storing Google Drive file references linked to any entity.

**Acceptance Criteria**
- `files`: `id, tenant_id, entity_type text check(order|model|model_version|print_job|print_attempt), entity_id uuid, name text not null, file_type text check(stl|image|gcode|pdf|sliced|reference|other), gdrive_url text, notes, uploaded_by uuid, created_at`
- RLS: users access only files in their tenant
- Index on `(tenant_id, entity_type, entity_id)`
- Migration runs cleanly

**Dependencies**
- MP-04

**Test Cases**
- Cross-tenant file metadata isolation

---

### MP-17 · File reference form + file list component

**Labels:** `epic: files` `sprint: 2` `size: M`

**Goal**
Reusable components to add and view Google Drive file references on any detail page.

**Acceptance Criteria**
- `<FileReferenceForm entityType="order" entityId={id} />`: form with name (required), file type (select), Google Drive URL, notes
- Submit → creates `files` row → form resets → file appears in list below
- `<FileList entityType="order" entityId={id} />`: lists files with icon by type, name, notes, date, "Abrir en Drive" link (opens in new tab)
- Empty state: "Sin archivos adjuntos. Pega un enlace de Google Drive."
- Components mounted on Order detail, Model detail, Print Job detail pages

**Technical Notes**
- Server action for insert; server component for list (RLS enforced)
- File type icon: STL → cube, image → photo, gcode → chip, pdf → document, etc.
- Validate Google Drive URL format (starts with `https://drive.google.com`)

**Dependencies**
- MP-16

**Test Cases**
- Add file reference → appears in list
- "Abrir en Drive" opens URL in new tab
- Invalid URL → validation error
- Cross-tenant entity_id → RLS blocks insert

---

### MP-18 · DB schema — printers + materials + print_profiles + RLS

**Labels:** `epic: production-setup` `sprint: 2` `size: M`

**Goal**
Production configuration tables with FDM/resin-specific print profile fields.

**Acceptance Criteria**
- `printers`: `id, tenant_id, name, type text check(FDM|resin|other), model_name, notes, is_active bool default true, created_at`
- `materials`: `id, tenant_id, name, brand, type text check(PLA|ABS|PETG|resin|other), color, notes, is_active bool default true, created_at`
- `print_profiles`: `id, tenant_id, name, printer_id fk, material_id fk, notes, is_active bool default true, created_at` + nullable setting columns:
  - FDM: `layer_height_mm decimal, nozzle_temp int, bed_temp int, print_speed_mm_s int, wall_count int, infill_pct int, supports bool, brim_raft_skirt text check(none|brim|raft|skirt)`
  - Resin: `exposure_time_s decimal, bottom_exposure_time_s decimal, lift_speed_mm_s decimal, resin_layer_height_mm decimal, supports_notes text`
- RLS policies for all three tables
- Seed adds 2 printers (1 FDM + 1 resin) and 3 materials (PLA, PETG, resin) for Moshicrea

**Dependencies**
- MP-04

**Test Cases**
- Cross-tenant isolation for all three tables
- FDM profile with only FDM fields set → valid insert
- Resin profile with only resin fields set → valid insert

---

### MP-19 · Admin settings — Printers CRUD

**Labels:** `epic: production-setup` `sprint: 2` `size: S`

**Goal**
Admin manages the tenant's printers.

**Acceptance Criteria**
- `/settings/printers`: table listing all printers (name, type badge, model, active status)
- "Agregar impresora" button → inline form: name (required), type (FDM|resin|other), model_name, notes
- Edit button on each row → same form pre-filled
- "Desactivar" soft-deletes (sets `is_active = false`); deactivated printers shown in collapsed section
- Only `owner`/`admin` roles can access `/settings/*` — others see 403 page

**Technical Notes**
- Settings layout (`settings/layout.tsx`) checks role and renders 403 if not owner/admin
- Use shadcn `DataTable` with row actions

**Dependencies**
- MP-06, MP-18

**Test Cases**
- Create FDM printer → appears in active list
- Deactivate → moves to inactive section
- `sales` role → 403 on `/settings/printers`

---

### MP-20 · Admin settings — Materials CRUD

**Labels:** `epic: production-setup` `sprint: 2` `size: S`

**Goal**
Admin manages materials.

**Acceptance Criteria**
- `/settings/materials`: list (name, brand, type badge, color swatch, active)
- Create/edit: name (required), brand, type, color, notes
- Deactivate / reactivate
- Only owner/admin

**Dependencies**
- MP-19 (reuse settings layout and patterns)

**Test Cases**
- Create PLA material → appears in list
- Deactivate → removed from active list and from print attempt dropdowns

---

### MP-21 · Admin settings — Print Profiles CRUD

**Labels:** `epic: production-setup` `sprint: 2` `size: M`

**Goal**
Admin creates reusable print recipes with FDM or resin-specific fields.

**Acceptance Criteria**
- `/settings/profiles`: list (name, printer, material, type badge, active)
- Create/edit form:
  - Name (required), printer (select active printers), material (select active materials)
  - After printer selected: show FDM fields OR resin fields depending on printer type
  - FDM fields: layer height, nozzle temp, bed temp, print speed, wall count, infill %, supports toggle, brim/raft/skirt select
  - Resin fields: layer height, exposure time, bottom exposure time, lift speed, supports notes
  - Notes field for both
- Deactivate / reactivate

**Technical Notes**
- Printer type fetched when printer is selected (client component with Supabase browser client)
- Form state conditional: `printerType === 'FDM' ? <FdmFields /> : <ResinFields />`

**Dependencies**
- MP-19, MP-20

**Test Cases**
- Select FDM printer → FDM fields shown, resin fields hidden
- Select resin printer → resin fields shown, FDM fields hidden
- Create FDM profile → appears in list with FDM badge

---

## Sprint 3 — Model Library

---

### MP-22 · DB schema — models + model_versions + order_model_options + RLS

**Labels:** `epic: model-library` `sprint: 3` `size: M`

**Goal**
Model library tables with statuses, versioning, source/license fields, and order research linking.

**Acceptance Criteria**
- `models`: `id, tenant_id, name text not null, description, status text default idea, tags text[], notes, source_url, source_platform, license, commercial_use_allowed bool, attribution_required bool, source_order_id (nullable fk orders), created_by, created_at, updated_at`
- Valid model statuses: `idea | researching | ready_to_test | tested_ok | needs_adjustments | production_ready | discarded`
- `model_versions`: `id, tenant_id, model_id fk, version_number int not null, notes, created_at`
- Unique constraint: `(model_id, version_number)`
- `order_model_options`: `id, tenant_id, order_id fk, model_id (nullable fk models), title text not null, source_url, notes, is_selected bool default false, created_at`
- RLS on all three tables
- Index on `(tenant_id, status)` for models

**Dependencies**
- MP-04, MP-10

**Test Cases**
- Cross-tenant isolation for all three tables
- `(model_id, version_number)` unique constraint enforced
- Only one `is_selected = true` option per order (enforced in app layer, not DB for MVP)

---

### MP-23 · Model library list page

**Labels:** `epic: model-library` `sprint: 3` `size: S`

**Goal**
Browse and search the tenant's model library.

**Acceptance Criteria**
- `/models`: lists models (name, status badge, source_platform if set, version count, tags)
- Filter by status; search by name
- "Nuevo Modelo" button
- Empty state: "La biblioteca está vacía. Agrega tu primer modelo."

**Dependencies**
- MP-06, MP-22

**Test Cases**
- Tenant models shown; filter by status works
- Empty state shown for new tenant

---

### MP-24 · Model detail page + add version

**Labels:** `epic: model-library` `sprint: 3` `size: M`

**Goal**
View a model's full detail, version history, source/license info, and linked files.

**Acceptance Criteria**
- `/models/[id]`: name, status badge, description, tags, notes
- Source/license section (collapsible): source_url (as link), source_platform, license, commercial_use_allowed, attribution_required
- Version list: version number, notes, date, "Agregar archivos" shortcut (links to FileReferenceForm with entity_type=model_version)
- "Agregar versión" button → `/models/[id]/versions/new`
- `/models/[id]/versions/new`: version number (auto = latest + 1), notes → creates model_version row
- `<FileList entityType="model_version" entityId={versionId} />` per version
- "Editar modelo" inline form for all model fields
- 404 for cross-tenant

**Dependencies**
- MP-23, MP-17

**Test Cases**
- Model with 0 versions → empty state + add version button
- Add version → version number = 1 for first, 2 for second
- Source/license section hidden if all fields empty

---

### MP-25 · Create/edit model form

**Labels:** `epic: model-library` `sprint: 3` `size: S`

**Goal**
Standalone create model page (also reused for edit).

**Acceptance Criteria**
- `/models/new`: name (required), description, status (select, default idea), tags (comma-separated input), notes
- Source/license section (optional, collapsible): source_url, source_platform (text), license, commercial_use_allowed (checkbox), attribution_required (checkbox)
- Submit → creates model → redirect to `/models/[id]`
- Edit: same form pre-filled, submit updates

**Dependencies**
- MP-23

**Test Cases**
- Create with only name → success
- Create with full source/license → all fields saved
- Tags stored as text array

---

### MP-26 · Link model option to order + select action

**Labels:** `epic: model-library` `sprint: 3` `size: M`

**Goal**
Sales user attaches research candidates to an order and marks one as selected.

**Acceptance Criteria**
- Order detail "Opciones de modelo" section has "Agregar opción" button
- Form: title (required), source_url (optional), notes, link to existing library model (optional searchable select)
- Options listed as cards: title, source link, notes, linked model badge (if set)
- "Seleccionar" button marks option as `is_selected = true`; deselects previous selected option
- Selected option highlighted with a green border/badge
- "Quitar selección" to deselect

**Technical Notes**
- Deselect previous on select: server action runs `UPDATE SET is_selected = false WHERE order_id = X`, then `UPDATE SET is_selected = true WHERE id = Y`
- Both updates in a Supabase RPC call or sequential actions for MVP

**Dependencies**
- MP-12, MP-22

**Test Cases**
- Add option without library link → saves with model_id null
- Select option → previous selected deselected
- Link option to existing library model → badge shown

---

### MP-27 · "Guardar en biblioteca" action from order option

**Labels:** `epic: model-library` `sprint: 3` `size: M`

**Goal**
Promote an order model option to the permanent model library.

**Acceptance Criteria**
- Each option card shows "Guardar en biblioteca" button (if `model_id` is null)
- Click → opens `/models/new` pre-filled: name from option title, notes from option notes
- On save → `order_model_options.model_id` updated to new model's ID
- Option card updates: "Guardado en biblioteca" badge, link to `/models/[id]`
- If option already has `model_id` → button shows "Ver en biblioteca" (links to model detail)

**Dependencies**
- MP-25, MP-26

**Test Cases**
- Save new model from option → model appears in library, option linked
- Pre-filled form has option title and notes
- Option shows "Guardado en biblioteca" after save

---

## Sprint 4 — Print Jobs + Dashboard

---

### MP-28 · DB schema — print_jobs + print_attempts + RLS

**Labels:** `epic: print-jobs` `sprint: 4` `size: M`

**Goal**
Production tracking tables with quantities on jobs and full settings capture on attempts.

**Acceptance Criteria**
- `print_jobs`: `id, tenant_id, order_id fk, model_version_id (nullable fk), status text check(pending|running|completed|failed) default pending, quantity_planned int not null, quantity_completed int default 0, quantity_failed int default 0, notes, created_by, created_at, updated_at`
- `print_attempts`: `id, tenant_id, print_job_id fk, printer_id fk, material_id fk, print_profile_id (nullable fk), result text check(success|failure|partial) not null, duration_min int, notes, failure_reason text, saved_as_profile_id (nullable fk print_profiles), created_at`
- Note: `print_attempts` has NO `updated_at` — records are immutable after insert
- RLS on both tables

**Technical Notes**
- Enforce immutability of `print_attempts` via RLS: only INSERT allowed (no UPDATE/DELETE policy)
- Index on `(tenant_id, order_id)` for print_jobs

**Dependencies**
- MP-04, MP-22, MP-18

**Test Cases**
- Cross-tenant isolation
- `print_attempts` UPDATE rejected by RLS
- `quantity_planned` required — null insert rejected

---

### MP-29 · Create print job from order + status transitions

**Labels:** `epic: print-jobs` `sprint: 4` `size: M`

**Goal**
Operator creates a print job from an order. Order status driven by print job status changes.

**Acceptance Criteria**
- Order detail "Trabajos de impresión" section shows "Crear trabajo de impresión" button
- Form: model version (select from models linked to order options, optional), quantity_planned (required, default = order.quantity), notes
- Submit → creates `print_jobs` row with `status: pending` → **order status does NOT change**
- Print job card appears in order detail with status badge + "Ver trabajo" link
- Print job detail shows "Iniciar impresión" button (pending → running) → order moves to `printing`
- "Completar" button (running → completed) → prompt for quantity_completed + quantity_failed → order moves to `post_processing`
- "Marcar como fallido" button (running → failed) → order moves to `failed_or_reprint`
- All order status changes use `lib/order-transitions.ts` validation

**Technical Notes**
- Print job status change triggers order status change in same server action
- Use Supabase transaction or sequential updates for atomicity

**Dependencies**
- MP-14, MP-28

**Test Cases**
- Create job → order stays `ready_for_factory`
- Start job (pending → running) → order becomes `printing`
- Complete job → order becomes `post_processing`
- Fail job → order becomes `failed_or_reprint`

---

### MP-30 · Print job detail page

**Labels:** `epic: print-jobs` `sprint: 4` `size: M`

**Goal**
Full print job view with attempt history, quantities, and status actions.

**Acceptance Criteria**
- `/print-jobs/[id]`: title (order title), linked order (link), model version (link if set), status badge, quantities (planned/completed/failed), notes
- Status action buttons (per MP-29 transitions)
- "Registrar intento" button → opens attempt form (inline or modal)
- Attempts listed as cards ordered by `created_at` desc
- Attempt card: printer, material, profile (if set), result badge, duration, notes, failure_reason (if failed), file links
- Success attempts: green border; failure: red border; partial: yellow
- `<FileList entityType="print_attempt" entityId={attemptId} />` per attempt card
- 404 for cross-tenant

**Dependencies**
- MP-29, MP-17

**Test Cases**
- Job with 0 attempts → empty state
- Success attempt → green card
- Failure attempt → red card with failure_reason

---

### MP-31 · Log print attempt

**Labels:** `epic: print-jobs` `sprint: 4` `size: M`

**Goal**
Operator records a print attempt with all settings and result.

**Acceptance Criteria**
- "Registrar intento" form: printer (select active), material (select active), print profile (select active, optional), result (success|failure|partial), duration_min (optional), notes
- `failure_reason` field appears and becomes required when result is `failure`
- Submit → creates immutable `print_attempts` row
- Attempt updates `quantity_completed` / `quantity_failed` on parent print_job:
  - result `success` → `quantity_completed += 1`
  - result `failure` → `quantity_failed += 1`
  - result `partial` → operator manually adjusts quantities on the job
- File references can be added to the attempt after creation via `<FileReferenceForm>`
- All labels in Spanish

**Technical Notes**
- `print_attempts` is INSERT-only; no edit allowed post-save
- quantity update is a separate UPDATE on `print_jobs` in the same server action

**Dependencies**
- MP-30

**Test Cases**
- Log success → quantity_completed increments
- Log failure without failure_reason → validation error
- Log failure → quantity_failed increments
- Attempt card shows correct colors and data

---

### MP-32 · "Guardar como perfil reutilizable" from successful attempt

**Labels:** `epic: print-jobs` `sprint: 4` `size: S`

**Goal**
A successful attempt's settings become a named reusable print profile.

**Acceptance Criteria**
- Successful attempt card shows "Guardar como perfil" button
- Click → opens a pre-filled create profile form (in modal or inline):
  - Pre-fills: printer, material, all captured settings from attempt
  - Name field (required, empty — user must name it)
- Submit → creates `print_profiles` row → `print_attempts.saved_as_profile_id` updated
- Button changes to "Perfil guardado: [name]" (with link to `/settings/profiles`)
- Button disabled after save — cannot save twice from same attempt

**Technical Notes**
- `saved_as_profile_id` update requires a server action that bypasses `print_attempts` immutability for this one field only — document explicitly or use a separate `print_attempt_profiles` join table. For MVP: allow UPDATE on `saved_as_profile_id` only (other fields remain immutable via RLS policy with column check).

**Dependencies**
- MP-30, MP-21

**Test Cases**
- Save profile from successful attempt → profile appears in `/settings/profiles`
- Button shows "Perfil guardado: [name]" after save
- Second click → button is disabled

---

### MP-33 · Dashboard KPI cards

**Labels:** `epic: dashboard` `sprint: 4` `size: S`

**Goal**
Single-glance production overview for any user.

**Acceptance Criteria**
- `/dashboard` renders 4 KPI cards:
  - "Esperando producción" — count of `ready_for_factory` orders
  - "En impresión" — count of `printing` orders
  - "Falló / Reimprimir" — count of `failed_or_reprint` orders
  - "Listo para entregar" — count of `ready_to_deliver` orders
- Each card clickable → `/orders?status=<status>`
- Counts are tenant-scoped only
- Page load under 2 seconds (single aggregated Supabase query using `.select('status').eq('tenant_id', id)` + client-side count, or a raw SQL count)

**Technical Notes**
- Use a single query: `SELECT status, COUNT(*) FROM orders WHERE tenant_id = $1 GROUP BY status`
- Run via Supabase RPC or raw SQL via server client

**Dependencies**
- MP-14 (orders with statuses exist)

**Test Cases**
- KPI counts match actual order counts per status
- Counts are 0 for statuses with no orders (not hidden)
- Clicking card navigates to filtered order list

---

### MP-34 · Dashboard production queue widget

**Labels:** `epic: dashboard` `sprint: 4` `size: S`

**Goal**
Operator sees their next 10 actionable orders below the KPI cards.

**Acceptance Criteria**
- Below KPI cards: list of up to 10 orders with status `ready_for_factory` or `printing`
- Each row: title, customer name (or "—"), urgency badge, status badge, "Abrir" link → `/orders/[id]`
- Sorted by urgency (high → normal → low), then by `created_at` asc (oldest first)
- "Ver todos" link → `/orders/board`
- Empty state: "No hay órdenes pendientes en producción."

**Dependencies**
- MP-33

**Test Cases**
- High-urgency order appears before normal-urgency
- More than 10 matching orders → only 10 shown, "Ver todos" visible
- Empty state when no orders in those statuses

---

## Summary

| Epic | Tickets | Sprint |
|---|---|---|
| Foundation & Auth | MP-01 – MP-06 | 1 |
| Customers | MP-07 – MP-09 | 1 |
| Orders | MP-10 – MP-15 | 2 |
| Files | MP-16 – MP-17 | 2 |
| Production Setup | MP-18 – MP-21 | 2 |
| Model Library | MP-22 – MP-27 | 3 |
| Print Jobs & Attempts | MP-28 – MP-32 | 4 |
| Dashboard | MP-33 – MP-34 | 4 |
| **Total** | **34 tickets** | **4 sprints** |

---

## How to create in GitHub Issues

### Option A — Install gh CLI
```bash
# Install: https://cli.github.com
gh auth login
# Then run /ship on each ticket — HIVE will create issues automatically
```

### Option B — GitHub web UI
1. Go to https://github.com/Kreitech/moshi-print/issues
2. Create labels listed at the top of this file
3. Create each issue with the title, body, and labels above

### Option C — GitHub API (curl)
```bash
# Set your token
GITHUB_TOKEN=your_token

# Example for MP-01
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Kreitech/moshi-print/issues \
  -d '{
    "title": "MP-01 · Initialize Next.js app with Supabase, Tailwind, shadcn/ui",
    "body": "...",
    "labels": ["epic: foundation", "sprint: 1", "size: M"]
  }'
```
