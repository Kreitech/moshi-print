"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
// redirect is kept for signUpWithPassword — signInWithPassword uses client-side redirect

export async function signInWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Return success and let the client redirect — avoids cookie loss on server redirect
  return { redirect: "/dashboard" };
}

export async function signUpWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Correo y contraseña son requeridos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      return { error: "Este correo ya está registrado. Intenta iniciar sesión." };
    }
    return { error: `No se pudo crear la cuenta: ${error.message}` };
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
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Enlace enviado. Revisa tu correo electrónico." };
}

export async function sendPasswordRecovery(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/update-password`,
  });

  if (error) {
    return { error: error.message };
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
    return { error: error.message };
  }

  return { redirect: "/dashboard" };
}
