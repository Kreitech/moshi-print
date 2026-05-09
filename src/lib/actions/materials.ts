"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const materialSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  brand: z.string().optional(),
  type: z.enum(["PLA", "ABS", "PETG", "resin", "other"]),
  color: z.string().optional(),
  notes: z.string().optional(),
});

export async function createMaterial(formData: FormData) {
  const parsed = materialSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    brand: (formData.get("brand") as string)?.trim(),
    type: formData.get("type"),
    color: (formData.get("color") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { error } = await supabase.from("materials").insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    brand: parsed.data.brand || null,
    type: parsed.data.type,
    color: parsed.data.color || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: "No se pudo crear el material." };
  return { success: true };
}

export async function updateMaterial(id: string, formData: FormData) {
  const parsed = materialSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    brand: (formData.get("brand") as string)?.trim(),
    type: formData.get("type"),
    color: (formData.get("color") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({
      name: parsed.data.name,
      brand: parsed.data.brand || null,
      type: parsed.data.type,
      color: parsed.data.color || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el material." };
  return { success: true };
}

export async function toggleMaterialActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el estado." };
  return { success: true };
}
