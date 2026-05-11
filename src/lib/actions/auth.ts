"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
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
