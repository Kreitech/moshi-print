# SPEC.md — MoshiPrint
_Last updated: 2026-05-08 | Run /sync to regenerate from github-issues_

## Project
- Stack: Next.js 14 (App Router) + Supabase + Vercel
- Repo: git@github.com:Kreitech/moshi-print.git
- Board: https://github.com/Kreitech/moshi-print/issues

## Sprint Overview

### Sprint 1 — Foundation + Customers
**Goal:** Working app with auth, multitenancy, RLS, and customer management.
**Tickets:** MP-01 to MP-09

| ID | Title | Size |
|---|---|---|
| MP-01 | Initialize Next.js app with Supabase, Tailwind, shadcn/ui | M |
| MP-02 | Supabase Auth — login page | S |
| MP-03 | DB schema — tenants + tenant_members + roles | M |
| MP-04 | RLS policies — tenants + tenant_members | S |
| MP-05 | Tenant onboarding — create workspace on first login | M |
| MP-06 | Auth middleware — protect routes + tenant context | S |
| MP-07 | DB schema — customers + RLS | S |
| MP-08 | Customer list page + create form | S |
| MP-09 | Customer detail page | S |

### Sprint 2 — Orders + Files + Production Setup
**Goal:** Full order lifecycle (kanban, workflow, transitions), file references, and admin configuration for production.
**Tickets:** MP-10 to MP-21

| ID | Title | Size |
|---|---|---|
| MP-10 | DB schema — orders + order_status + RLS | M |
| MP-11 | Create order form | S |
| MP-12 | Order detail page | M |
| MP-13 | Order kanban board | M |
| MP-14 | Order status transitions + "Enviar a fábrica" | M |
| MP-15 | Order list page with filters | S |
| MP-16 | DB schema — files metadata + RLS | S |
| MP-17 | File reference form + file list component | M |
| MP-18 | DB schema — printers + materials + print_profiles + RLS | M |
| MP-19 | Admin settings — Printers CRUD | S |
| MP-20 | Admin settings — Materials CRUD | S |
| MP-21 | Admin settings — Print Profiles CRUD | M |

### Sprint 3 — Model Library
**Goal:** Independent model catalog with versions, source/license tracking, and order research workflow.
**Tickets:** MP-22 to MP-27

| ID | Title | Size |
|---|---|---|
| MP-22 | DB schema — models + model_versions + order_model_options + RLS | M |
| MP-23 | Model library list page | S |
| MP-24 | Model detail page + add version | M |
| MP-25 | Create/edit model form | S |
| MP-26 | Link model option to order + select action | M |
| MP-27 | "Guardar en biblioteca" action from order option | M |

### Sprint 4 — Print Jobs + Dashboard
**Goal:** Full production tracking loop — print jobs, attempts, reusable profiles, and dashboard.
**Tickets:** MP-28 to MP-34

| ID | Title | Size |
|---|---|---|
| MP-28 | DB schema — print_jobs + print_attempts + RLS | M |
| MP-29 | Create print job from order + status transitions | M |
| MP-30 | Print job detail page | M |
| MP-31 | Log print attempt | M |
| MP-32 | "Guardar como perfil reutilizable" from successful attempt | S |
| MP-33 | Dashboard KPI cards | S |
| MP-34 | Dashboard production queue widget | S |

## Totals
- Sprints: 4
- Tickets: 34
- S tickets: 16
- M tickets: 18
