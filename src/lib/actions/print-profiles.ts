"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  printer_id: z.string().uuid("Selecciona una impresora."),
  material_id: z.string().uuid("Selecciona un material."),
  notes: z.string().optional(),
  layer_height_mm: z.coerce.number().positive().optional().or(z.literal("")),
  nozzle_temp: z.coerce.number().int().positive().optional().or(z.literal("")),
  bed_temp: z.coerce.number().int().min(0).optional().or(z.literal("")),
  print_speed_mm_s: z.coerce.number().int().positive().optional().or(z.literal("")),
  wall_count: z.coerce.number().int().positive().optional().or(z.literal("")),
  infill_pct: z.coerce.number().int().min(0).max(100).optional().or(z.literal("")),
  supports: z.enum(["true", "false"]).optional(),
  brim_raft_skirt: z.enum(["none", "brim", "raft", "skirt"]).optional().or(z.literal("")),
  exposure_time_s: z.coerce.number().positive().optional().or(z.literal("")),
  bottom_exposure_time_s: z.coerce.number().positive().optional().or(z.literal("")),
  lift_speed_mm_s: z.coerce.number().positive().optional().or(z.literal("")),
  resin_layer_height_mm: z.coerce.number().positive().optional().or(z.literal("")),
  supports_notes: z.string().optional(),
});

function nullIfEmpty<T>(v: T | "" | undefined): T | null {
  return v === "" || v === undefined ? null : v;
}

export async function createPrintProfile(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const d = parsed.data;
  const { error } = await supabase.from("print_profiles").insert({
    tenant_id: tenant.id,
    name: d.name,
    printer_id: d.printer_id,
    material_id: d.material_id,
    notes: d.notes || null,
    layer_height_mm: nullIfEmpty(d.layer_height_mm) as number | null,
    nozzle_temp: nullIfEmpty(d.nozzle_temp) as number | null,
    bed_temp: nullIfEmpty(d.bed_temp) as number | null,
    print_speed_mm_s: nullIfEmpty(d.print_speed_mm_s) as number | null,
    wall_count: nullIfEmpty(d.wall_count) as number | null,
    infill_pct: nullIfEmpty(d.infill_pct) as number | null,
    supports: d.supports === "true" ? true : d.supports === "false" ? false : null,
    brim_raft_skirt: nullIfEmpty(d.brim_raft_skirt) as "none" | "brim" | "raft" | "skirt" | null,
    exposure_time_s: nullIfEmpty(d.exposure_time_s) as number | null,
    bottom_exposure_time_s: nullIfEmpty(d.bottom_exposure_time_s) as number | null,
    lift_speed_mm_s: nullIfEmpty(d.lift_speed_mm_s) as number | null,
    resin_layer_height_mm: nullIfEmpty(d.resin_layer_height_mm) as number | null,
    supports_notes: d.supports_notes || null,
  });

  if (error) return { error: "No se pudo crear el perfil." };
  return { success: true };
}

export async function toggleProfileActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("print_profiles")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el estado." };
  return { success: true };
}
