"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import {
  type OrderStatus,
  isValidTransition,
} from "@/lib/order-transitions";
import { optionalNonNegativeNumber } from "@/lib/zod-helpers";

const PAYMENT_STATUSES = ["not_tracked", "pending", "partial", "paid"] as const;

const optionalPriceAmount = optionalNonNegativeNumber("El precio no puede ser negativo.");

const orderSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  description: z.string().optional(),
  customer_id: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).default(1),
  urgency: z.enum(["low", "normal", "high"]).default("normal"),
  notes: z.string().optional(),
  charged_price_amount: optionalPriceAmount,
  charged_price_currency: z.string().optional(),
  charged_price_notes: z.string().optional(),
  quoted_price_amount: optionalPriceAmount,
  quoted_price_currency: z.string().optional(),
  payment_status: z.enum(PAYMENT_STATUSES).default("not_tracked"),
});

export async function createOrder(formData: FormData) {
  const raw = {
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    customer_id: (formData.get("customer_id") as string)?.trim(),
    quantity: formData.get("quantity"),
    urgency: formData.get("urgency"),
    notes: (formData.get("notes") as string)?.trim(),
    charged_price_amount: formData.get("charged_price_amount"),
    charged_price_currency: (formData.get("charged_price_currency") as string)?.trim(),
    charged_price_notes: (formData.get("charged_price_notes") as string)?.trim(),
    quoted_price_amount: formData.get("quoted_price_amount"),
    quoted_price_currency: (formData.get("quoted_price_currency") as string)?.trim(),
    payment_status: formData.get("payment_status") || "not_tracked",
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
      charged_price_amount: parsed.data.charged_price_amount ?? null,
      charged_price_currency: parsed.data.charged_price_currency || "UYU",
      charged_price_notes: parsed.data.charged_price_notes || null,
      quoted_price_amount: parsed.data.quoted_price_amount ?? null,
      quoted_price_currency: parsed.data.quoted_price_currency || "UYU",
      payment_status: parsed.data.payment_status,
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
    customer_id: (formData.get("customer_id") as string)?.trim(),
    quantity: formData.get("quantity"),
    urgency: formData.get("urgency"),
    notes: (formData.get("notes") as string)?.trim(),
    charged_price_amount: formData.get("charged_price_amount"),
    charged_price_currency: (formData.get("charged_price_currency") as string)?.trim(),
    charged_price_notes: (formData.get("charged_price_notes") as string)?.trim(),
    quoted_price_amount: formData.get("quoted_price_amount"),
    quoted_price_currency: (formData.get("quoted_price_currency") as string)?.trim(),
    payment_status: formData.get("payment_status") || "not_tracked",
  };

  const parsed = orderSchema
    .pick({
      title: true,
      description: true,
      customer_id: true,
      quantity: true,
      urgency: true,
      notes: true,
      charged_price_amount: true,
      charged_price_currency: true,
      charged_price_notes: true,
      quoted_price_amount: true,
      quoted_price_currency: true,
      payment_status: true,
    })
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
      customer_id: parsed.data.customer_id || null,
      quantity: parsed.data.quantity,
      urgency: parsed.data.urgency,
      notes: parsed.data.notes || null,
      charged_price_amount: parsed.data.charged_price_amount ?? null,
      charged_price_currency: parsed.data.charged_price_currency || "UYU",
      charged_price_notes: parsed.data.charged_price_notes || null,
      quoted_price_amount: parsed.data.quoted_price_amount ?? null,
      quoted_price_currency: parsed.data.quoted_price_currency || "UYU",
      payment_status: parsed.data.payment_status,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo guardar los cambios." };

  const newCustomerId = parsed.data.customer_id || null;
  if (newCustomerId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", newCustomerId)
      .maybeSingle();
    return { success: true, customer: customer ?? null };
  }
  return { success: true, customer: null };
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
