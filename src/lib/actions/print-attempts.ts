"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const attemptSchema = z.object({
  printer_id: z.string().uuid("Selecciona una impresora."),
  material_id: z.string().uuid("Selecciona un material."),
  print_profile_id: z.string().uuid().optional().or(z.literal("")),
  result: z.enum(["success", "failure", "partial"]).optional().or(z.literal("")),
  duration_min: z.coerce.number().int().positive().optional().or(z.literal("")),
  notes: z.string().optional(),
  failure_reason: z.string().optional(),
}).refine(
  (d) => d.result !== "failure" || (d.failure_reason && d.failure_reason.trim().length > 0),
  { message: "La razon de falla es requerida.", path: ["failure_reason"] }
);

const updateAttemptSchema = z.object({
  result: z.enum(["success", "failure", "partial"]).optional().or(z.literal("")),
  duration_min: z.coerce.number().int().positive().optional().or(z.literal("")),
  notes: z.string().optional(),
  failure_reason: z.string().optional(),
}).refine(
  (d) => d.result !== "failure" || (d.failure_reason && d.failure_reason.trim().length > 0),
  { message: "La razon de falla es requerida.", path: ["failure_reason"] }
);

async function incrementJobField(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  field: "quantity_completed" | "quantity_failed"
) {
  const { data: job } = await supabase
    .from("print_jobs")
    .select(field)
    .eq("id", jobId)
    .maybeSingle();
  if (job !== null) {
    await supabase
      .from("print_jobs")
      .update({ [field]: ((job as Record<string, number>)[field] ?? 0) + 1 })
      .eq("id", jobId);
  }
}

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
  const result = d.result || null;

  const { error } = await supabase.from("print_attempts").insert({
    tenant_id: tenant.id,
    print_job_id: jobId,
    printer_id: d.printer_id,
    material_id: d.material_id,
    print_profile_id: d.print_profile_id || null,
    result,
    duration_min: d.duration_min ? Number(d.duration_min) : null,
    notes: d.notes || null,
    failure_reason: d.failure_reason || null,
  });

  if (error) return { error: "No se pudo registrar el intento." };

  if (result === "success") {
    await incrementJobField(supabase, jobId, "quantity_completed");
  } else if (result === "failure") {
    await incrementJobField(supabase, jobId, "quantity_failed");
  }

  return { success: true };
}

export async function updatePrintAttempt(attemptId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateAttemptSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: existing } = await supabase
    .from("print_attempts")
    .select("result, print_job_id")
    .eq("id", attemptId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!existing) return { error: "Intento no encontrado." };

  const d = parsed.data;
  const newResult = d.result || null;

  const { error } = await supabase
    .from("print_attempts")
    .update({
      result: newResult,
      duration_min: d.duration_min ? Number(d.duration_min) : null,
      notes: d.notes || null,
      failure_reason: d.failure_reason || null,
    })
    .eq("id", attemptId);

  if (error) return { error: "No se pudo actualizar el intento." };

  // Update job quantities only when result changes from null (draft) to a final result
  if (!existing.result && newResult) {
    if (newResult === "success") {
      await incrementJobField(supabase, existing.print_job_id, "quantity_completed");
    } else if (newResult === "failure") {
      await incrementJobField(supabase, existing.print_job_id, "quantity_failed");
    }
  }

  return { success: true, jobId: existing.print_job_id };
}
