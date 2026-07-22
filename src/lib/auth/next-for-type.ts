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
