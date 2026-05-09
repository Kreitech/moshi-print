"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createTenant(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "El nombre del espacio de trabajo es requerido." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  // Use service role to bypass RLS — tenant does not exist yet so the user
  // cannot satisfy the tenant_members-based RLS check.
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseSlug = slugify(name) || "workspace";

  // Find a unique slug
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    const { data: existing } = await service
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const { data: tenant, error: tenantError } = await service
    .from("tenants")
    .insert({ name, slug })
    .select()
    .single();

  if (tenantError || !tenant) {
    return { error: "No se pudo crear el espacio de trabajo." };
  }

  const { error: memberError } = await service.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: "No se pudo crear el espacio de trabajo." };
  }

  redirect("/dashboard");
}
