"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getActiveTenant } from "@/lib/get-active-tenant";
import type { TenantRole } from "@/types/database";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOrigin(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
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

  const origin = await getOrigin();
  const { data: invited, error: inviteError } =
    await svc.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/confirm`,
    });

  if (inviteError || !invited.user) {
    return { error: inviteError?.message ?? "Error al enviar la invitación." };
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
