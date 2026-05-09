"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const optionSchema = z.object({
  title: z.string().min(1, "El titulo es requerido."),
  source_url: z.string().url("URL invalida.").optional().or(z.literal("")),
  notes: z.string().optional(),
  model_id: z.string().uuid().optional().or(z.literal("")),
});

export async function addModelOption(orderId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = optionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const d = parsed.data;
  const { error } = await supabase.from("order_model_options").insert({
    tenant_id: tenant.id,
    order_id: orderId,
    model_id: d.model_id || null,
    title: d.title,
    source_url: d.source_url || null,
    notes: d.notes || null,
  });

  if (error) return { error: "No se pudo agregar la opcion." };
  return { success: true };
}

export async function selectModelOption(optionId: string, orderId: string) {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { error: clearError } = await supabase
    .from("order_model_options")
    .update({ is_selected: false })
    .eq("order_id", orderId)
    .eq("tenant_id", tenant.id);

  if (clearError) return { error: "No se pudo actualizar las opciones." };

  const { error } = await supabase
    .from("order_model_options")
    .update({ is_selected: true })
    .eq("id", optionId);

  if (error) return { error: "No se pudo seleccionar la opcion." };
  return { success: true };
}

export async function removeModelOption(optionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_model_options")
    .delete()
    .eq("id", optionId);

  if (error) return { error: "No se pudo eliminar la opcion." };
  return { success: true };
}
