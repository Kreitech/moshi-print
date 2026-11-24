# Moshi Print

> TODO: One sentence description.

## Tech Lead
Rafael

## Stack
node-react-prisma

## Setup
TODO: Add setup instructions after stack is configured.

## Email sign-in and team recovery

- Set `NEXT_PUBLIC_APP_URL` to the public URL of the deployment. In Supabase Auth, set the Site URL to the same origin and allow its `/auth/confirm` URL and the `type` query variants used by signup, magic links, recovery, and invites.
- Default Supabase links using `{{ .ConfirmationURL }}` are supported. To let recipients open a link in a different browser without the original PKCE cookie, use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=TYPE` in each template. Use `email` for magic links, `signup` for sign-up confirmations, `invite` for invitations, and `recovery` for password resets. Keep confirmation on and configure custom SMTP for delivery to regular team accounts. Disable SMTP link tracking for Auth messages.
- A workspace owner can resend an invitation or send a password-reset link to a member's stored address in **Configuración → Equipo**. The owner can correct the email on a pending invitation when the account belongs only to that workspace. The member must open a new invitation to confirm the new address. If delivery fails after a correction, resend the invitation from the member's row.
- Apply `20261124000000_restrict_membership_writes/migration.sql` before enabling these actions. Membership writes use service-role server actions. The migration preserves authenticated reads and removes direct client writes that could bypass the server role checks.
- Run `node --test scripts/auth-smoke.mjs` against a local app on port 3091, or set `MOSHI_TEST_URL` to the deployment under test. For a delivery check, use a test mailbox to exercise a magic link, a password reset, and an invitation. Verify that a workspace owner sees the email actions and an administrator does not.
