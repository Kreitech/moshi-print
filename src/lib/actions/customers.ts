"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const customerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Correo inválido.").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  };

  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message;
    return { error: message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenant.id,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !customer) {
    return { error: "No se pudo crear el cliente." };
  }

  redirect(`/customers/${customer.id}`);
}
