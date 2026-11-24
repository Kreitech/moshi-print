"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getActiveTenant } from "@/lib/get-active-tenant";
import type { TenantRole } from "@/types/database";
import { authEmailError, emailCallbackUrl, getAppOrigin } from "@/lib/auth/email-delivery";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "No autenticado.", user: null, tenant: null, role: null };

  const tenant = await getActiveTenant(supabase);
  if (!tenant)
    return {
      error: "Sin espacio de trabajo.",
      user: null,
      tenant: null,
      role: null,
    };

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { error: "Sin permisos.", user: null, tenant: null, role: null };
  }

  return { error: null, user, tenant, role: membership.role as TenantRole };
}

export type TeamMember = {
  id: string;
  user_id: string;
  role: TenantRole;
  email: string;
  pendingInvite: boolean;
  created_at: string;
};

export async function inviteTeamMember(formData: FormData) {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as TenantRole;

  if (!email) return { error: "El email es requerido." };
  if (!["admin", "operator", "sales"].includes(role))
    return { error: "Rol inválido." };
  if (ctx.role === "admin" && role === "admin") {
    return { error: "Solo el propietario puede agregar administradores." };
  }

  const svc = service();

  const { data: existingMembers } = await svc
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", ctx.tenant!.id);

  const { data: usersData } = await svc.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === email
  );

  if (existingUser) {
    if (existingMembers?.some((m) => m.user_id === existingUser.id)) {
      return { error: "Este usuario ya es miembro del equipo." };
    }
    const { error } = await svc.from("tenant_members").insert({
      tenant_id: ctx.tenant!.id,
      user_id: existingUser.id,
      role,
    });
    if (error) return { error: "Error al agregar el miembro." };
    revalidatePath("/settings/team");
    return { success: true, invited: false };
  }

  const origin = await getAppOrigin();
  const { data: invited, error: inviteError } =
    await svc.auth.admin.inviteUserByEmail(email, {
      redirectTo: emailCallbackUrl(origin, "invite"),
    });

  if (inviteError || !invited.user) {
    return { error: inviteError ? authEmailError(inviteError) : "Error al enviar la invitación." };
  }

  const { error: memberError } = await svc.from("tenant_members").insert({
    tenant_id: ctx.tenant!.id,
    user_id: invited.user.id,
    role,
  });

  if (memberError) return { error: "Error al crear la membresía." };

  revalidatePath("/settings/team");
  return { success: true, invited: true };
}

async function getOwnerTarget(memberId: FormDataEntryValue | null) {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };
  if (ctx.role !== "owner" || !ctx.tenant) {
    return { error: "Solo el propietario puede gestionar el acceso por correo." };
  }
  const id = z.uuid().safeParse(memberId);
  if (!id.success) return { error: "Miembro inválido." };

  const svc = service();
  const { data: target, error } = await svc.from("tenant_members")
    .select("user_id, role")
    .eq("tenant_id", ctx.tenant.id)
    .eq("id", id.data)
    .maybeSingle();
  if (error || !target) return { error: "No pudimos encontrar al miembro en este equipo." };

  const { data, error: authError } = await svc.auth.admin.getUserById(target.user_id);
  if (authError || !data.user?.email) return { error: "No encontramos un correo para ese miembro." };
  return { svc, target, user: data.user, email: data.user.email };
}

export async function sendMemberAccessEmail(formData: FormData) {
  const ctx = await getOwnerTarget(formData.get("member_id"));
  if (!ctx.svc) return { error: ctx.error };
  const origin = await getAppOrigin();
  if (!ctx.user.email_confirmed_at) {
    const { error } = await ctx.svc.auth.admin.inviteUserByEmail(ctx.email, {
      redirectTo: emailCallbackUrl(origin, "invite"),
    });
    return error ? { error: authEmailError(error) } : { success: "Invitación reenviada." };
  }

  // The member receives the link on their own device, so there is no PKCE verifier.
  const auth = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
  ).auth;
  const { error } = await auth.resetPasswordForEmail(ctx.email, {
    redirectTo: emailCallbackUrl(origin, "recovery"),
  });
  return error ? { error: authEmailError(error) } : { success: "Correo de recuperación enviado." };
}

export async function correctPendingMemberEmail(formData: FormData) {
  const ctx = await getOwnerTarget(formData.get("member_id"));
  if (!ctx.svc) return { error: ctx.error };
  if (ctx.target.role === "owner" || !ctx.user.invited_at ||
      ctx.user.email_confirmed_at || ctx.user.last_sign_in_at ||
      ctx.user.identities?.some((identity) => identity.provider !== "email")) {
    return { error: "Solo se puede corregir el correo de una invitación pendiente." };
  }

  const email = z.string().trim().toLowerCase().pipe(z.email()).safeParse(formData.get("email"));
  if (!email.success) return { error: "Ingresá un correo válido." };
  if (email.data === ctx.email.toLowerCase()) return { error: "Ingresá un correo distinto." };

  const { count, error: membershipError } = await ctx.svc.from("tenant_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id);
  if (membershipError || count !== 1) {
    return { error: "La cuenta debe pertenecer únicamente a este equipo para cambiar el correo." };
  }

  const { error } = await ctx.svc.auth.admin.updateUserById(ctx.user.id, { email: email.data });
  if (error) {
    console.warn("[team] Pending email correction failed", { memberId: ctx.target.user_id, code: error.code });
    return { error: error.code === "email_exists" ? "Ese correo ya está registrado." : "No se pudo cambiar el correo." };
  }

  revalidatePath("/settings/team");
  const { error: inviteError } = await ctx.svc.auth.admin.inviteUserByEmail(email.data, {
    redirectTo: emailCallbackUrl(await getAppOrigin(), "invite"),
  });
  if (inviteError) {
    return { error: `Se cambió el correo. Podés reenviar la invitación desde el equipo. ${authEmailError(inviteError)}` };
  }
  return { success: "Correo corregido e invitación enviada." };
}

export async function updateMemberRole(formData: FormData) {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const memberId = formData.get("member_id") as string;
  const newRole = formData.get("role") as TenantRole;

  if (!memberId || !newRole) return { error: "Datos inválidos." };
  if (!["owner", "admin", "operator", "sales"].includes(newRole))
    return { error: "Rol inválido." };

  const svc = service();

  const { data: target } = await svc
    .from("tenant_members")
    .select("role, user_id")
    .eq("id", memberId)
    .eq("tenant_id", ctx.tenant!.id)
    .maybeSingle();

  if (!target) return { error: "Miembro no encontrado." };
  if (target.user_id === ctx.user!.id)
    return { error: "No puedes cambiar tu propio rol." };
  if (ctx.role === "admin" && ["owner", "admin"].includes(target.role)) {
    return { error: "No tienes permisos para modificar este rol." };
  }
  if (newRole === "owner" && ctx.role !== "owner") {
    return { error: "Solo el propietario puede asignar el rol de propietario." };
  }

  const { error } = await svc
    .from("tenant_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) return { error: "Error al actualizar el rol." };

  revalidatePath("/settings/team");
  return { success: true };
}

export async function removeMember(formData: FormData) {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const memberId = formData.get("member_id") as string;
  if (!memberId) return { error: "Datos inválidos." };

  const svc = service();

  const { data: target } = await svc
    .from("tenant_members")
    .select("role, user_id")
    .eq("id", memberId)
    .eq("tenant_id", ctx.tenant!.id)
    .maybeSingle();

  if (!target) return { error: "Miembro no encontrado." };
  if (target.user_id === ctx.user!.id)
    return { error: "No puedes eliminarte a ti mismo." };
  if (ctx.role === "admin" && ["owner", "admin"].includes(target.role)) {
    return { error: "No tienes permisos para eliminar este miembro." };
  }

  const { error } = await svc
    .from("tenant_members")
    .delete()
    .eq("id", memberId);

  if (error) return { error: "Error al eliminar el miembro." };

  revalidatePath("/settings/team");
  return { success: true };
}
