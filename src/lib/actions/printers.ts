"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const printerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  type: z.enum(["FDM", "resin", "other"]),
  model_name: z.string().optional(),
  notes: z.string().optional(),
});

export async function createPrinter(formData: FormData) {
  const parsed = printerSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    type: formData.get("type"),
    model_name: (formData.get("model_name") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { error } = await supabase.from("printers").insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    type: parsed.data.type,
    model_name: parsed.data.model_name || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: "No se pudo crear la impresora." };
  return { success: true };
}

export async function updatePrinter(id: string, formData: FormData) {
  const parsed = printerSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    type: formData.get("type"),
    model_name: (formData.get("model_name") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("printers")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      model_name: parsed.data.model_name || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar la impresora." };
  return { success: true };
}

export async function togglePrinterActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("printers")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el estado." };
  return { success: true };
}
