"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { authEmailError, emailCallbackUrl, getAppOrigin } from "@/lib/auth/email-delivery";

function readEmail(formData: FormData) {
  const value = formData.get("email");
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function signInWithPassword(formData: FormData) {
  const email = readEmail(formData);
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirmá tu correo con el enlace que recibiste para iniciar sesión." };
    }
    console.warn("[auth] Password login failed", { code: error.code });
    return { error: "No pudimos iniciar sesión. Revisá el correo y la contraseña." };
  }

  // Return success and let the client redirect — avoids cookie loss on server redirect
  return { redirect: "/dashboard" };
}

export async function signUpWithPassword(formData: FormData) {
  const email = readEmail(formData);
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Correo y contraseña son requeridos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: emailCallbackUrl(origin, "signup") },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      return { error: "Este correo ya está registrado. Intenta iniciar sesión." };
    }
    return { error: authEmailError(error) };
  }

  // Email confirmation required — no active session yet
  if (!data.session) {
    return { success: "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión." };
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithMagicLink(formData: FormData) {
  const email = readEmail(formData);

  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: emailCallbackUrl(origin, "magiclink") },
  });

  if (error) {
    return { error: authEmailError(error) };
  }

  return { success: "Enlace enviado. Revisa tu correo electrónico." };
}

export async function sendPasswordRecovery(formData: FormData) {
  const email = readEmail(formData);

  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: emailCallbackUrl(origin, "recovery"),
  });

  if (error) {
    return { error: authEmailError(error) };
  }

  return { success: "Revisa tu correo para restablecer tu contraseña." };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "session_not_found" || error.name === "AuthSessionMissingError") {
      return { error: "Tu sesión expiró. Solicitá un enlace nuevo desde el inicio de sesión." };
    }
    console.warn("[auth] Password reset failed", { code: error.code });
    return { error: "No se pudo actualizar la contraseña. Intentá de nuevo." };
  }

  return { redirect: "/dashboard" };
}
