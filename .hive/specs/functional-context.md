# Functional Context — MoshiPrint
_Captured: 2026-05-07 | Source: client intake_

## Client
- Company: Moshicrea (first tenant / reference customer)
- Industry: 3D printing / custom products workshop (cookie cutters, articulated models, resin pieces, educational tools, custom objects)
- Team size: 2 users at launch (Yessi + Rafa); up to 20 users across 5 tenants at pilot stage

## Problem
Moshicrea manages 3D printing orders informally through WhatsApp messages, Google Drive folders, memory, screenshots, slicer files, and manual coordination. Orders arrive in multiple formats: as STL files directly from customers, as image references requiring model creation, or as vague requests requiring model research. There is no centralized system to track what has been ordered, what is being printed, and what settings produce good results.

The cost of not solving this is high: operators waste time searching for previous files and settings; successful print configurations are lost after each job; failed prints repeat because failure reasons are not documented; quoting is difficult without production history; and scaling beyond two people is practically impossible without a shared system.

## Users

| User Role | Primary Task | Current Pain |
|---|---|---|
| Sales/Admin (Yessi) | Receive orders, create customers, upload files/references, research model options, approve and send to production | No central tracker; searches WhatsApp + GDrive manually; no history of past models |
| Production Operator (Rafa) | Manage production queue, assign printers/materials, log print attempts, record results and notes | No factory queue; print settings not persisted; failed attempts not documented |
| Owner/Admin | Manage users, roles, printers, materials, profiles; review history and production state | No visibility into shop performance or configuration state |

## Functional Requirements

### Critical (must launch with)

**Auth & Multitenancy**
- Supabase Auth login (email/password + magic link)
- Multitenant architecture: every table scoped by `tenant_id`
- Supabase Row Level Security as the authorization source of truth
- Tenant/workspace creation and management
- Tenant member management with roles: `owner`, `admin`, `operator`, `sales`

**Customer Management**
- Create, edit, view customers (name, contact info, notes)
- Customer list with search

**Order Management**
- Create orders: customer, product description, notes, quantity, urgency
- Orders can start without an STL — the workflow supports researching the model later
- Order statuses (linear with branching): `new` → `researching` → `pending_approval` → `ready_for_factory` → `printing` → `post_processing` → `ready_to_deliver` → `delivered` | `failed_or_reprint` | `cancelled`
- Kanban board view organized by status
- Order list with filters: status, customer, date, tags
- "Send to factory" action (transitions order to `ready_for_factory`)
- Order detail page showing all linked files, model options, and print jobs

**File Management**
- Files stored in Google Drive; only metadata stored in Postgres
- Metadata per file: `name`, `mime_type`, `file_type` (stl | image | gcode | pdf | sliced | reference | other), `size`, `gdrive_file_id`, `gdrive_folder_id`, `entity_type`, `entity_id`, `tenant_id`, `uploaded_by`
- Upload files from order detail (originals + prepared folders)
- Upload files from model/print job detail
- Google Drive folder structure:
  - `/MoshiPrint/{tenant_id}/orders/{order_id}/originals`
  - `/MoshiPrint/{tenant_id}/orders/{order_id}/prepared`
  - `/MoshiPrint/{tenant_id}/models/{model_id}/versions`
  - `/MoshiPrint/{tenant_id}/print-jobs/{print_job_id}/results`

**Model Library**
- Independent model library (not just order attachments)
- Model statuses: `idea` → `researching` → `ready_to_test` → `tested_ok` | `needs_adjustments` → `production_ready` | `discarded`
- Model versions: each version is a distinct STL/file set with version number and notes
- Model options linked to an order (research candidates before one is selected)
- "Save as library model" action — promotes an order model option to the shared library
- Model list with search/filter (name, status, tags)
- Model detail page with version history

**Print Jobs & Attempts**
- Create print job from an order, linked to a model version
- Print job detail page
- Log print attempts: printer, material, print profile, estimated duration, result (success | failure | partial), photos, notes, failure reason
- Every attempt preserves all settings regardless of outcome (failed attempts are valuable data)
- "Save as reusable profile" action — creates a PrintProfile from a successful attempt
- Print attempt history on print job

**Production Setup (Admin)**
- Printer CRUD: name, type (FDM | resin | other), model, notes
- Material CRUD: name, brand, type (PLA | ABS | PETG | resin | other), color, notes
- Print Profile CRUD: name, linked printer, linked material, layer height, infill %, supports, notes

**Dashboard**
- Orders waiting for production count (`ready_for_factory`)
- Currently printing count (`printing`)
- Failed / reprint needed count (`failed_or_reprint`)
- Ready to deliver count (`ready_to_deliver`)

**Search & History**
- Search orders by customer, status, model, date, tags
- Search models by name, status, tags
- View print history for a model (all past jobs + attempts + settings used)

### Important (post-MVP)
- Cost estimation per order
- Time and material consumption reports
- Payment status tracking

### Nice-to-have (deferred)
- Automated Google Drive folder creation on order/model creation
- STL 3D preview in browser
- Slicer software integration
- Printer telemetry
- WhatsApp / email notifications
- AI-assisted model search and classification
- AI prompt helper for STL from image
- Multi-language UI (UI is Spanish first; multi-language deferred)
- Public customer portal
- Inventory management

## Non-Functional Requirements
- **Scale:** 2 users / 1 tenant at launch; up to 20 users / 5 tenants at pilot
- **Performance:** Dashboard and list pages under 2s; paginate all lists; index `tenant_id`, `status`, `created_at`
- **Security:** Tenant data isolation via Supabase RLS is critical — no cross-tenant data leakage; users may only access tenants where they are active members; no custom auth or permission engine
- **Prisma + RLS note:** Use Prisma for schema definition, migrations, and seeds only. Use Supabase client (server-side with `auth.uid()` context) for all application CRUD so RLS is enforced at the database layer. If Prisma is used for any application queries, the tenant isolation approach must be explicitly documented.
- **Accessibility:** Keyboard-friendly forms and buttons; good color contrast; no WCAG certification required for MVP
- **Language:** User-facing UI in Spanish. All code, variable names, comments, and logs in English.

## Technical Context
- **Stack:** Next.js 14+ (App Router), React 18, TypeScript strict mode, Tailwind CSS, shadcn/ui
- **Database:** Supabase Postgres with Row Level Security
- **Auth:** Supabase Auth (email/password + magic link)
- **Schema/Migrations:** Prisma (schema definition + migrations); Supabase client for application queries
- **File storage:** Google Drive API via central service account (MVP); metadata in Postgres
- **Hosting:** Vercel (app), Supabase (db/auth), Google Drive (files)
- **Repository:** git@github.com:Kreitech/moshi-print.git
- **Type:** Greenfield — no legacy code

> **Stack deviation note:** The HIVE project config (`AGENTS.local.md`) is set to `node-react-prisma` (Express + CRA). The actual target stack is Next.js + Supabase. The stack config must be updated before implementation begins.

## Constraints
- **Timeline:** MVP usable in 2–4 weeks of part-time development. External pilot at 6–10 weeks if MVP succeeds.
- **Budget:** Minimize cost — free/low-cost Supabase + Vercel tiers; existing Google Drive storage; avoid paid services unless clearly justified.
- **Team:** Part-time solo development (Rafa) using Claude Code + HIVE. Tickets must be small, clear, and independently implementable as vertical slices.
- **Dependencies:** Supabase project setup, Vercel project setup, Google Drive API credentials, GitHub repo access

## Product Principles
- Simple and fast UI — Yessi creates an order quickly without filling unnecessary fields
- Rafa always has a clear, actionable production queue
- Every print leaves reusable knowledge behind (profiles, notes, photos)
- Failed prints are useful data — easy to record, never deleted
- Models and orders are related but independent concepts
- Design as SaaS from day one; build as MVP
- Do not overengineer

## Open Questions
- [ ] `pending_approval` status: is this internal approval (Yessi → Rafa) or customer sign-off? — Assumed internal only for MVP
- [ ] Google Drive: central service account (MVP) or per-tenant OAuth flow? — Assumed: central service account for MVP; per-tenant in future
- [ ] Automatic GDrive folder creation on entity creation, or on first file upload? — Assumed: on first upload for MVP simplicity; auto-create deferred
- [ ] Tags: free-form text or predefined taxonomy? — Assumed: free-form strings for MVP
- [ ] Model option vs selected model: does an order track which option was "selected" or just store all options and one becomes the library model? — The selected/promoted option becomes the library entry; order keeps references to all options
