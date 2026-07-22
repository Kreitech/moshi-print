# Manual QA Checklist — MoshiPrint

This checklist covers manual verification steps for the auth fix, order pricing,
model licensing, and the commerce/product publishing layer. Update it as new
areas are added; do not delete sections for features that already shipped.

## Before testing

- [ ] Run `npx prisma migrate deploy` (or `db:migrate` in dev) against the
      target Supabase project to apply the three new migrations:
      `order_pricing`, `model_license_fields`, `commerce_products`.
- [ ] Confirm the Supabase dashboard's invite/recovery email templates and
      redirect URL allowlist include `/auth/confirm` and `/auth/callback`.

## Auth

- [ ] Existing user can log in with email/password.
- [ ] Invalid credentials show a clear Spanish error, no crash.
- [ ] Owner/admin can invite a user from Configuración > Equipo.
- [ ] Invited user receives the Supabase invite email.
- [ ] Opening the invite link lands on `/update-password` (not `/login`), for both
      query-param based projects (`?code=` or `?token_hash=&type=invite`) and
      implicit-flow projects (`#access_token=...` handled via `/auth/callback`).
- [ ] Invited user can set a password and is redirected to `/dashboard`.
- [ ] Invited user lands inside the tenant they were invited to (checked via
      Configuración > Equipo membership, or by confirming tenant-scoped data).
- [ ] Invited user cannot see or access other tenants' data.
- [ ] "¿Olvidaste tu contraseña?" sends a recovery email.
- [ ] Opening the recovery email link lands on `/update-password`.
- [ ] Setting a new password redirects to `/dashboard`.
- [ ] An expired or already-used invite link shows the Spanish error page
      (`/auth/error`) with a clear message and a "Volver a inicio de sesión" CTA.
- [ ] An expired or already-used recovery link shows the same Spanish error page.
- [ ] No access/refresh/invite/recovery tokens appear in server logs (check
      Vercel function logs for the request).

## Orders / pricing

- [ ] Create an order without any price — saves fine, no price shown on detail.
- [ ] Create an order with a charged price and currency — saves and displays.
- [ ] Edit an existing order to add a charged price after the fact.
- [ ] Charged price is visible on the order detail page only when present.
- [ ] A user from Tenant A cannot see or edit pricing on a Tenant B order
      (verify via RLS — direct query with a different tenant's session fails).

## Models / license

- [ ] Create a model without any source/license info — saves fine.
- [ ] Create a model with `commercial_use_allowed = true`.
- [ ] Attempt to create a sellable product from a model with unknown
      (`null`) commercial-use status — warning is shown.
- [ ] Attempt to set a product to `ready` or `published` when the source
      model's `commercial_use_allowed = false` — action is blocked with a
      clear Spanish message.
- [ ] Attempt to set a product to `ready`/`published` with unknown license as
      a non-admin/owner — blocked. Repeat as owner/admin with a license note
      filled in — allowed (the explicit override path).
- [ ] "Crear producto vendible" only appears on model detail when the
      model's status is `tested_ok` or `production_ready`.

## Products

- [ ] Create a product manually (not from a model).
- [ ] Create a product from an existing model ("Crear producto vendible") —
      name/description/commercial_use_allowed prefill correctly.
- [ ] Add a product variant (color/size/material).
- [ ] Generate a MercadoLibre listing draft — content matches the channel
      guidance (clear title, material, lead time, inclusions).
- [ ] Generate an Instagram listing draft — visual/sales tone, hashtags.
- [ ] Generate a Facebook Marketplace listing draft — short, local tone,
      price/pickup info.
- [ ] Generate a WhatsApp listing draft — short, price/colors/timing.
- [ ] Paste an external URL onto a listing after manual publication.
- [ ] Mark a listing as `published` / `paused`.
- [ ] A user from Tenant A cannot see Tenant B's products, variants, or
      listing drafts.

## Files / Google Drive

- [ ] A tenant with Drive connected can upload/link files from an order.
- [ ] A tenant without Drive connected sees a clear Spanish message and,
      for admins, a CTA to connect Drive.
- [ ] A non-admin user sees a passive message (no broken upload control) when
      Drive isn't connected.
- [ ] Owner/admin can connect Google Drive from Configuración > Storage.
- [ ] Non-admin cannot access the Drive connection action.
