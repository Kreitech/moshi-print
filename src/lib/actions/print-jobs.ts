"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { isValidTransition, type OrderStatus } from "@/lib/order-transitions";

const createJobSchema = z.object({
  order_id: z.string().uuid(),
  model_version_id: z.string().uuid().optional().or(z.literal("")),
  quantity_planned: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  notes: z.string().optional(),
});

export async function createPrintJob(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = createJobSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "No autenticado." };

  const d = parsed.data;
  const { data, error } = await supabase
    .from("print_jobs")
    .insert({
      tenant_id: tenant.id,
      order_id: d.order_id,
      model_version_id: d.model_version_id || null,
      quantity_planned: d.quantity_planned,
      notes: d.notes || null,
      created_by: user.user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el trabajo." };
  return { success: true, id: data.id };
}

export async function transitionPrintJobStatus(
  jobId: string,
  newStatus: "pending" | "running" | "completed" | "failed",
  extras?: { quantity_completed?: number; quantity_failed?: number }
) {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: job } = await supabase
    .from("print_jobs")
    .select("status, order_id, quantity_completed, quantity_failed")
    .eq("id", jobId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!job) return { error: "Trabajo no encontrado." };

  const JOB_TRANSITIONS: Record<string, string[]> = {
    pending: ["running"],
    running: ["completed", "failed"],
    completed: [],
    failed: [],
  };

  if (!JOB_TRANSITIONS[job.status]?.includes(newStatus)) {
    return { error: `No se puede cambiar de ${job.status} a ${newStatus}.` };
  }

  const jobUpdate: Record<string, unknown> = { status: newStatus };
  if (extras?.quantity_completed !== undefined) {
    jobUpdate.quantity_completed = extras.quantity_completed;
  }
  if (extras?.quantity_failed !== undefined) {
    jobUpdate.quantity_failed = extras.quantity_failed;
  }

  const { error: jobError } = await supabase
    .from("print_jobs")
    .update(jobUpdate)
    .eq("id", jobId);

  if (jobError) return { error: "No se pudo actualizar el trabajo." };

  const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
    running: "printing",
    completed: "post_processing",
    failed: "failed_or_reprint",
  };

  const targetOrderStatus = ORDER_STATUS_MAP[newStatus];
  if (targetOrderStatus) {
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", job.order_id)
      .maybeSingle();

    if (order && isValidTransition(order.status as OrderStatus, targetOrderStatus)) {
      await supabase
        .from("orders")
        .update({ status: targetOrderStatus })
        .eq("id", job.order_id);
    }
  }

  return { success: true };
}
