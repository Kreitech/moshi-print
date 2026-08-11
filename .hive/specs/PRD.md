# PRD — MoshiPrint v0.1
_Last updated: 2026-05-08 | Owner: Rafael_

## Problem
Small 3D printing workshops manage orders, models, and production settings informally through WhatsApp, Google Drive folders, and memory. There is no system of record for the order lifecycle, no persistent knowledge base for print settings, and no production queue. The result is repeated failed prints, lost customer context, and a workflow that cannot scale beyond one or two people.

## Goal
Get Moshicrea off WhatsApp and into a purpose-built tool — so every order is tracked, every model is versioned, and every print (success or failure) leaves reusable knowledge behind.

**Measurable outcome:** Moshicrea completes a full order cycle (intake → printing → delivery) without using WhatsApp or GDrive manually for any step that MoshiPrint covers.

## Users
| Role | Description |
|---|---|
| `sales` | Receives customer requests, creates orders, researches model options, sends to production |
| `operator` | Manages production queue, logs print jobs and attempts, records results |
| `admin` | Configures printers, materials, profiles, manages team members |
| `owner` | All admin capabilities + workspace settings |

---

## Features

### Must-Have (MVP)

---

#### F1 — Auth & Multitenancy

- [ ] **Login:** Given a registered user, When they submit email + password or request a magic link, Then they are authenticated and redirected to `/dashboard`
  - Supabase Auth handles all authentication — no custom auth engine
  - Failed login shows a Spanish error message
  - Unauthenticated routes redirect to `/login`

- [ ] **Tenant workspace:** Given a new user with no workspace, When they complete the onboarding form, Then a `tenants` record is created and they become the `owner`
  - Every tenant-scoped table has a `tenant_id` column
  - Users can only access data within tenants they are members of

- [ ] **Row Level Security:** Given any database operation, When it runs in application context, Then Supabase RLS policies enforce tenant isolation at the DB layer
  - No cross-tenant data leakage is possible through the application
  - Prisma is used for schema definition and migrations only; Supabase client handles all app queries

- [ ] **Roles:** Given a tenant member, When they perform an action, Then only actions permitted by their role succeed
  - Roles: `owner`, `admin`, `operator`, `sales`
  - `owner`/`admin` access `/settings/*`; `operator` creates print jobs; `sales` creates orders/customers

---

#### F2 — Customer Management

- [ ] **Create customer:** Given a `sales` or `admin` user, When they submit the new customer form, Then a customer record is created in their tenant
  - Required: name. Optional: email, phone, notes
  - Customer belongs to one tenant; isolated by RLS

- [ ] **List and search customers:** Given a user on `/customers`, When the page loads, Then all tenant customers are listed with a search input
  - Search filters by name
  - Empty state shown when no customers exist

- [ ] **Customer detail:** Given a user clicks a customer, When `/customers/[id]` loads, Then name, contact info, notes, and order history are shown
  - Order history is a read-only list (title, status, date)
  - Cross-tenant customer ID returns 404

---

#### F3 — Order Management

- [ ] **Create order:** Given a `sales` user on `/orders/new`, When they submit the form, Then an order is created with status `new`
  - Required: title. Optional: customer, description, quantity, urgency, notes
  - Orders can be created without a customer or STL file — the workflow supports starting with just a description

- [ ] **Order lifecycle with optional paths:** Given an order, When an authorized user triggers a status transition, Then the order advances to a valid next status
  - **Full path:** `new` → `researching` → `pending_approval` → `ready_for_factory` → `printing` → `post_processing` → `ready_to_deliver` → `delivered`
  - **Short path (STL ready):** `new` → `ready_for_factory` (skips `researching` and `pending_approval` entirely)
  - `researching` and `pending_approval` are optional — orders with a ready STL bypass them
  - Branch statuses reachable from `printing`: `failed_or_reprint` (returns to `ready_for_factory` on retry), `post_processing`
  - Terminal statuses: `delivered`, `cancelled` — no further transitions
  - Invalid transitions are rejected server-side

- [ ] **"Send to factory" action:** Given an order in `new`, `pending_approval`, or `researching` status, When a `sales` or `admin` user clicks "Send to factory", Then the order transitions to `ready_for_factory`
  - The action is available from any pre-production status — not just `pending_approval`
  - Button is visually prominent on the order detail page

- [ ] **Kanban board:** Given a user on `/orders/board`, When the page loads, Then all tenant orders are displayed in columns by status
  - Each card shows: title, customer name, quantity, urgency indicator
  - Cards link to order detail
  - No drag-and-drop for MVP — status changes only via order detail

- [ ] **Order list with filters:** Given a user on `/orders`, When they apply filters, Then the list updates to show matching orders
  - Filter by: status (multi-select), customer, urgency, date range
  - Pagination: 20 orders per page
  - Default sort: `created_at` descending

- [ ] **Order detail:** Given a user on `/orders/[id]`, When the page loads, Then all order fields, linked files, model options, and print jobs are shown
  - Edit action for title, description, notes, urgency, quantity
  - Sections: Files, Model Options, Print Jobs (can be empty)
  - Cross-tenant order ID returns 404

---

#### F4 — File Management

**F4a — Manual Google Drive link entry (MVP)**

- [ ] **Store file reference:** Given a user on any detail page, When they paste a Google Drive link and fill in metadata, Then a `files` record is created linking that entity to the file
  - Fields: name, file type (stl | image | gcode | pdf | sliced | reference | other), Google Drive URL, notes
  - No direct upload in MVP — the user uploads to GDrive manually and pastes the link
  - `entity_type` + `entity_id` links the record to its parent (order, model, model_version, print_job, print_attempt)
  - `tenant_id` is always set; RLS enforced

- [ ] **File list:** Given a detail page with file records, When the `<FileList>` component renders, Then each file shows name, type icon, notes, date, and "Open in Drive" link
  - Files fetched server-side (RLS enforced)
  - Empty state shown when no files attached

**F4b — Direct Google Drive upload (post-MVP follow-up)**

- [ ] **File upload from app:** Given a user on any detail page, When they select or drag a file, Then it is uploaded directly to Google Drive and metadata is saved automatically
  - Progress indicator shown during upload
  - Folder structure: `/MoshiPrint/{tenant_id}/{entity_type}/{entity_id}/{subfolder}`
  - Orders: `.../originals` and `.../prepared`; Models: `.../versions`; Print jobs: `.../results`
  - *Deferred: requires Google Drive API service account credentials and server-side upload handler*

---

#### F5 — Model Library

- [ ] **Model library:** Given a user on `/models`, When the page loads, Then all tenant models are listed with search and status filter
  - Model statuses: `idea` → `researching` → `ready_to_test` → `tested_ok` | `needs_adjustments` → `production_ready` | `discarded`
  - Models exist independently from orders

- [ ] **Model source and license:** Given a model record, When source and license fields are filled, Then the model's origin and usage rights are visible to the team
  - Fields: `source_url`, `source_platform` (e.g. Thingiverse, Printables, Makerworld, custom), `license`, `commercial_use_allowed` (bool), `attribution_required` (bool)
  - All fields optional — not required for MVP workflow
  - Visible on model detail page

- [ ] **Model versions:** Given a model, When a new version is added, Then it appears in the model's version history
  - Each version has: version number (auto-incremented), notes, linked file references
  - Previous versions are preserved and viewable

- [ ] **Order model options:** Given an order in research, When a `sales` user adds a model option, Then it appears in the order's "Model Options" section
  - Option fields: title, source URL (optional), notes, link to library model (optional)
  - One option can be marked as selected (`is_selected = true`)
  - Options represent research candidates — not the final model

- [ ] **Save as library model:** Given a model option on an order, When a user clicks "Save to Library", Then a new `models` record is created (or linked to an existing one)
  - Prefills model name and notes from the option
  - `order_model_options.model_id` is updated to point to the library entry
  - The option card shows a "Saved to library" confirmation state

---

#### F6 — Production Setup

- [ ] **Printer management:** Given an `admin` on `/settings/printers`, When they create or edit a printer, Then it is available for selection in print jobs and attempts
  - Fields: name, type (FDM | resin | other), model name, notes
  - Deactivate removes from selection dropdowns without deleting records

- [ ] **Material management:** Given an `admin` on `/settings/materials`, When they create or edit a material, Then it is available for selection in print attempts
  - Fields: name, brand, type (PLA | ABS | PETG | resin | other), color, notes
  - Deactivate removes from selection dropdowns

- [ ] **Print profile management:** Given an `admin` on `/settings/profiles`, When they create a print profile, Then it is available as a reusable recipe for print attempts
  - Required fields: name, printer (select active), material (select active)
  - **FDM-specific optional fields:** `layer_height_mm`, `nozzle_temperature`, `bed_temperature`, `print_speed_mm_s`, `wall_count`, `infill_percentage`, `supports` (bool), `brim_raft_skirt` (none | brim | raft | skirt)
  - **Resin-specific optional fields:** `layer_height_mm`, `exposure_time_s`, `bottom_exposure_time_s`, `lift_speed_mm_s`, `supports_notes`
  - Which fields are shown depends on the selected printer's type (FDM or resin)
  - `notes` field available for both types
  - Deactivate removes from selection dropdowns

---

#### F7 — Print Jobs & Attempts

- [ ] **Create print job:** Given an `operator` on an order detail, When they click "Create Print Job", Then a print job is created with status `pending` — the order status does NOT change
  - Print job links to the order and optionally to a model version
  - Print job has status: `pending` | `running` | `completed` | `failed`
  - Print job includes production quantities: `quantity_planned` (required), `quantity_completed` (default 0), `quantity_failed` (default 0)
  - Creating a print job does not affect order status

- [ ] **Print job status transitions:** Given a print job, When an operator updates its status, Then the order status updates accordingly
  - `pending` → `running`: order transitions to `printing`
  - `running` → `completed`: operator sets final `quantity_completed` and `quantity_failed`; order transitions to `post_processing`
  - `running` → `failed`: order transitions to `failed_or_reprint`
  - Order status is driven by its print jobs — not by creating them

- [ ] **Log print attempt:** Given an `operator` on a print job, When they submit the attempt form, Then all settings and the result are saved
  - Required: printer, material, result (success | failure | partial)
  - Optional: print profile, duration (min), failure reason (required if result is failure), notes, file references (photos via F4a link entry)
  - All attempt data is immutable after saving — nothing is deleted
  - Attempt outcome updates `quantity_completed` / `quantity_failed` on the parent print job

- [ ] **Attempt history:** Given a print job with attempts, When the print job page loads, Then all attempts are listed with full detail
  - Failure attempts styled with warning/red; success with green
  - File links open in Google Drive

- [ ] **Save as reusable profile:** Given a successful print attempt, When an `operator` clicks "Save as Profile", Then a new `print_profiles` record is created from the attempt's settings
  - Pre-fills all captured settings (printer, material, temperatures, speeds, layer height, etc.)
  - On save: `print_attempts.saved_as_profile_id` is updated; button shows "Saved as: [name]"
  - Cannot save twice from the same attempt

---

#### F8 — Dashboard

- [ ] **KPI cards:** Given any user on `/dashboard`, When the page loads, Then 4 cards show real-time order counts for the tenant
  - Card 1 — "Esperando producción": count of `ready_for_factory` orders
  - Card 2 — "En impresión": count of `printing` orders
  - Card 3 — "Falló / Reimprimir": count of `failed_or_reprint` orders
  - Card 4 — "Listo para entregar": count of `ready_to_deliver` orders
  - Each card links to `/orders?status=<status>`
  - Page loads under 2 seconds (single aggregated DB query)

- [ ] **Production queue widget:** Given any user on `/dashboard`, When the page loads, Then up to 10 orders in `ready_for_factory` or `printing` are listed below the KPI cards
  - Sorted by urgency (high first), then `created_at`
  - Each row: title, customer, urgency badge, status, "Open" link
  - "View all" link goes to `/orders/board`

---

### Should Have (post-MVP)
- **Cost estimation:** Given an order, When a cost is entered, Then materials + time are tracked for quoting — *deferred: requires pricing data not yet available*
- **Consumption reports:** Given an admin, When they view reports, Then time and material usage by printer/period are shown — *deferred: needs print attempt data accumulation first*
- **Payment tracking:** Given an order, When a payment status is set, Then it's tracked alongside delivery — *deferred: simple field addition post-MVP*
- **Direct file upload (F4b):** Given a user, When they select a file in the app, Then it uploads directly to Google Drive — *deferred: requires GDrive API setup; MVP uses manual link entry*

### Could Have (v2)
- Automated Google Drive folder creation on entity creation
- STL 3D preview in browser
- AI-assisted model search and classification
- AI prompt helper for STL generation from reference image
- Public customer portal
- WhatsApp / email notifications
- Multi-language UI (Spanish only for MVP)

### Won't Have
- Slicer software integration — complexity too high for MVP timeline
- Printer telemetry / direct printer connectivity — hardware dependency out of scope
- Custom auth or permission engine — Supabase handles this; do not replicate
- Inventory management — separate problem domain
