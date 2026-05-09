"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const attemptSchema = z.object({
  printer_id: z.string().uuid("Selecciona una impresora."),
  material_id: z.string().uuid("Selecciona un material."),
  print_profile_id: z.string().uuid().optional().or(z.literal("")),
  result: z.enum(["success", "failure", "partial"]),
  duration_min: z.coerce.number().int().positive().optional().or(z.literal("")),
  notes: z.string().optional(),
  failure_reason: z.string().optional(),
}).refine(
  (d) => d.result !== "failure" || (d.failure_reason && d.failure_reason.trim().length > 0),
  { message: "La razon de falla es requerida.", path: ["failure_reason"] }
);

export async function logPrintAttempt(jobId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = attemptSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const d = parsed.data;
  const { error } = await supabase.from("print_attempts").insert({
    tenant_id: tenant.id,
    print_job_id: jobId,
    printer_id: d.printer_id,
    material_id: d.material_id,
    print_profile_id: d.print_profile_id || null,
    result: d.result,
    duration_min: d.duration_min ? Number(d.duration_min) : null,
    notes: d.notes || null,
    failure_reason: d.failure_reason || null,
  });

  if (error) return { error: "No se pudo registrar el intento." };

  // Update parent print_job quantities
  if (d.result === "success") {
    await supabase.rpc("increment_job_quantity", {
      job_id: jobId,
      col: "quantity_completed",
    }).then(() => {
      // Fallback if RPC not available: manual update
    });

    const { data: job } = await supabase
      .from("print_jobs")
      .select("quantity_completed")
      .eq("id", jobId)
      .maybeSingle();

    if (job !== null) {
      await supabase
        .from("print_jobs")
        .update({ quantity_completed: (job?.quantity_completed ?? 0) + 1 })
        .eq("id", jobId);
    }
  } else if (d.result === "failure") {
    const { data: job } = await supabase
      .from("print_jobs")
      .select("quantity_failed")
      .eq("id", jobId)
      .maybeSingle();

    if (job !== null) {
      await supabase
        .from("print_jobs")
        .update({ quantity_failed: (job?.quantity_failed ?? 0) + 1 })
        .eq("id", jobId);
    }
  }

  return { success: true };
}
