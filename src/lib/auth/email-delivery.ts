import { headers } from "next/headers";
import type { AuthError } from "@supabase/supabase-js";

export function authEmailError(error: AuthError) {
  console.warn("[auth/email] Email request failed", { code: error.code, status: error.status });
  switch (error.code) {
    case "email_address_not_authorized":
      return "El servicio de correo de MoshiPrint no tiene habilitado ese destinatario. Avisale al propietario.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Se alcanzó el límite de envíos. Esperá un rato antes de volver a intentarlo.";
    default:
      return "No se pudo enviar el correo. Intentá de nuevo o avisale al propietario.";
  }
}

export function emailCallbackUrl(origin: string, type: string) {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("type", type);
  return url.toString();
}

export async function getAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return new URL(configured).origin;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost:") ? "http" : "https");
  return new URL(`${proto}://${host}`).origin;
}
