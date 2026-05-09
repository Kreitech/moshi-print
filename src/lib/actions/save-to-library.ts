"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

export async function saveOptionToLibrary(optionId: string, orderId: string) {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "No autenticado." };

  const { data: option } = await supabase
    .from("order_model_options")
    .select("*")
    .eq("id", optionId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!option) return { error: "Opcion no encontrada." };
  if (option.model_id) return { error: "Esta opcion ya esta vinculada a un modelo." };

  const { data: model, error: modelError } = await supabase
    .from("models")
    .insert({
      tenant_id: tenant.id,
      name: option.title,
      status: "idea",
      tags: [],
      source_url: option.source_url ?? null,
      notes: option.notes ?? null,
      source_order_id: orderId,
      created_by: user.user.id,
    })
    .select("id")
    .single();

  if (modelError) return { error: "No se pudo crear el modelo en biblioteca." };

  const { error: linkError } = await supabase
    .from("order_model_options")
    .update({ model_id: model.id })
    .eq("id", optionId);

  if (linkError) return { error: "Modelo creado pero no se pudo vincular a la opcion." };

  return { success: true, modelId: model.id };
}
