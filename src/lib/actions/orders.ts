"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import {
  type OrderStatus,
  isValidTransition,
} from "@/lib/order-transitions";

const orderSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().optional(),
  customer_id: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).default(1),
  urgency: z.enum(["low", "normal", "high"]).default("normal"),
  notes: z.string().optional(),
});

export async function createOrder(formData: FormData) {
  const raw = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    customer_id: (formData.get("customer_id") as string)?.trim(),
    quantity: formData.get("quantity"),
    urgency: formData.get("urgency"),
    notes: (formData.get("notes") as string)?.trim(),
  };

  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      customer_id: parsed.data.customer_id || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      quantity: parsed.data.quantity,
      urgency: parsed.data.urgency,
      notes: parsed.data.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !order) return { error: "No se pudo crear el pedido." };

  redirect(`/orders/${order.id}`);
}

export async function updateOrder(id: string, formData: FormData) {
  const raw = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    quantity: formData.get("quantity"),
    urgency: formData.get("urgency"),
    notes: (formData.get("notes") as string)?.trim(),
  };

  const parsed = orderSchema
    .pick({ title: true, description: true, quantity: true, urgency: true, notes: true })
    .safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      quantity: parsed.data.quantity,
      urgency: parsed.data.urgency,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo guardar los cambios." };
  return { success: true };
}

export async function transitionOrderStatus(
  id: string,
  nextStatus: OrderStatus
) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!order) return { error: "Pedido no encontrado." };

  if (!isValidTransition(order.status as OrderStatus, nextStatus)) {
    return { error: "Transición no válida." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", id);

  if (error) return { error: "No se pudo cambiar el estado." };
  return { success: true };
}
