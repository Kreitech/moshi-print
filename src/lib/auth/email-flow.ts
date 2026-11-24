import type { EmailOtpType } from "@supabase/supabase-js";

export function emailFlow(value: string | null): EmailOtpType | null {
  switch (value) {
    case "signup":
    case "invite":
    case "magiclink":
    case "recovery":
    case "email_change":
    case "email":
      return value;
    default:
      return null;
  }
}

export function emailDestination(type: EmailOtpType | null) {
  if (type === "invite" || type === "recovery") return "/update-password";
  if (type === "signup") return "/onboarding";
  return "/dashboard";
}

export function emailErrorPath(type: EmailOtpType | null) {
  return type ? `/auth/error?type=${type}` : "/auth/error";
}
