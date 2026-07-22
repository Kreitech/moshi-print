// Shared between the server-side /auth/confirm route and the client-side
// /auth/callback shim so both agree on where a verified session should land.
export type ConfirmType =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | null;

export function nextForConfirmType(type: ConfirmType): string {
  switch (type) {
    case "recovery":
    case "invite":
      // Invited users must set a password before entering the app; recovery
      // reuses the same "set a new password" screen.
      return "/update-password";
    case "signup":
      return "/onboarding";
    default:
      return "/dashboard";
  }
}

// The `next` param comes from an unauthenticated, attacker-reachable query
// string (/auth/confirm?next=...). It is later concatenated as `${origin}${next}`
// — without this check, a value like "@evil.com/" or ".evil.com/x" resolves to a
// different host once concatenated (open redirect). Only allow a same-site,
// single-segment-rooted path.
export function sanitizeNextPath(next: string | null, type: ConfirmType): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    return next;
  }
  return nextForConfirmType(type);
}
