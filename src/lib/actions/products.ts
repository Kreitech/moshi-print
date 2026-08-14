"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { optionalNonNegativeNumber, optionalNonNegativeInt } from "@/lib/zod-helpers";
import { checkPublishableStatus } from "@/lib/products/license-gate";
import { buildListingDraft } from "@/lib/products/channel-draft";
import type { SalesChannelProvider } from "@/types/database";

const PRODUCT_STATUSES = ["draft", "ready", "published", "paused", "archived"] as const;
const STOCK_MODES = ["made_to_order", "in_stock"] as const;
const CHANNEL_PROVIDERS = [
  "mercadolibre",
  "instagram",
  "facebook",
  "tiendanube",
  "woocommerce",
  "etsy",
  "whatsapp",
  "manual",
] as const;
const LISTING_STATUSES = ["draft", "published", "paused", "error"] as const;

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().optional(),
  model_id: z.string().uuid().optional().or(z.literal("")),
  base_price_amount: optionalNonNegativeNumber("El precio no puede ser negativo."),
  base_price_currency: z.string().optional(),
  production_cost_amount: optionalNonNegativeNumber("El costo no puede ser negativo."),
  production_cost_currency: z.string().optional(),
  lead_time_days: optionalNonNegativeInt("El tiempo de entrega no puede ser negativo."),
  status: z.enum(PRODUCT_STATUSES).default("draft"),
  stock_mode: z.enum(STOCK_MODES).default("made_to_order"),
  available_quantity: optionalNonNegativeInt("La cantidad no puede ser negativa."),
  commercial_use_allowed: z.enum(["true", "false"]).optional(),
  attribution_required: z.enum(["true", "false"]).optional(),
  license_notes: z.string().optional(),
  notes: z.string().optional(),
});

async function getCurrentRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

// model_id/product_id arrive as plain form/param values, not scoped by RLS on
// their own — without this check a tenant could link their product/variant to
// another tenant's model/product row (the insert's own tenant_id is correct,
// but the foreign key it references wouldn't be).
async function modelBelongsToTenant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  modelId: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("models")
    .select("id")
    .eq("id", modelId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !!data;
}

async function productBelongsToTenant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sellable_products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !!data;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: (formData.get("name") as string)?.trim(),
    description: (formData.get("description") as string)?.trim(),
    model_id: (formData.get("model_id") as string)?.trim(),
    base_price_amount: formData.get("base_price_amount"),
    base_price_currency: (formData.get("base_price_currency") as string)?.trim(),
    production_cost_amount: formData.get("production_cost_amount"),
    production_cost_currency: (formData.get("production_cost_currency") as string)?.trim(),
    lead_time_days: formData.get("lead_time_days"),
    status: formData.get("status") || "draft",
    stock_mode: formData.get("stock_mode") || "made_to_order",
    available_quantity: formData.get("available_quantity"),
    commercial_use_allowed: formData.get("commercial_use_allowed") || undefined,
    attribution_required: formData.get("attribution_required") || undefined,
    license_notes: (formData.get("license_notes") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  });
}

export async function createProduct(formData: FormData) {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const commercialUseAllowed =
    d.commercial_use_allowed === "true" ? true : d.commercial_use_allowed === "false" ? false : null;

  const role = await getCurrentRole(supabase, tenant.id, user.id);
  const gate = checkPublishableStatus(
    d.status,
    commercialUseAllowed,
    d.license_notes ?? null,
    role === "owner" || role === "admin"
  );
  if (!gate.allowed) return { error: gate.reason };

  if (d.model_id) {
    const belongsToTenant = await modelBelongsToTenant(supabase, d.model_id, tenant.id);
    if (!belongsToTenant) return { error: "Modelo no encontrado." };
  }

  const { data: product, error } = await supabase
    .from("sellable_products")
    .insert({
      tenant_id: tenant.id,
      model_id: d.model_id || null,
      name: d.name,
      description: d.description || null,
      base_price_amount: d.base_price_amount ?? null,
      base_price_currency: d.base_price_currency || "UYU",
      production_cost_amount: d.production_cost_amount ?? null,
      production_cost_currency: d.production_cost_currency || "UYU",
      lead_time_days: d.lead_time_days ?? null,
      status: d.status,
      stock_mode: d.stock_mode,
      available_quantity: d.available_quantity ?? null,
      commercial_use_allowed: commercialUseAllowed,
      attribution_required:
        d.attribution_required === "true" ? true : d.attribution_required === "false" ? false : null,
      license_notes: d.license_notes || null,
      notes: d.notes || null,
    })
    .select("id")
    .single();

  if (error || !product) return { error: "No se pudo crear el producto." };

  redirect(`/products/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const commercialUseAllowed =
    d.commercial_use_allowed === "true" ? true : d.commercial_use_allowed === "false" ? false : null;

  const role = await getCurrentRole(supabase, tenant.id, user.id);
  const gate = checkPublishableStatus(
    d.status,
    commercialUseAllowed,
    d.license_notes ?? null,
    role === "owner" || role === "admin"
  );
  if (!gate.allowed) return { error: gate.reason };

  if (d.model_id) {
    const belongsToTenant = await modelBelongsToTenant(supabase, d.model_id, tenant.id);
    if (!belongsToTenant) return { error: "Modelo no encontrado." };
  }

  const { error } = await supabase
    .from("sellable_products")
    .update({
      name: d.name,
      description: d.description || null,
      model_id: d.model_id || null,
      base_price_amount: d.base_price_amount ?? null,
      base_price_currency: d.base_price_currency || "UYU",
      production_cost_amount: d.production_cost_amount ?? null,
      production_cost_currency: d.production_cost_currency || "UYU",
      lead_time_days: d.lead_time_days ?? null,
      status: d.status,
      stock_mode: d.stock_mode,
      available_quantity: d.available_quantity ?? null,
      commercial_use_allowed: commercialUseAllowed,
      attribution_required:
        d.attribution_required === "true" ? true : d.attribution_required === "false" ? false : null,
      license_notes: d.license_notes || null,
      notes: d.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo guardar los cambios." };

  revalidatePath(`/products/${id}`);
  return { success: true };
}

const variantSchema = z.object({
  sku: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  price_delta_amount: optionalNonNegativeNumber("El ajuste de precio no puede ser negativo."),
  price_delta_currency: z.string().optional(),
  notes: z.string().optional(),
});

export async function addProductVariant(productId: string, formData: FormData) {
  const parsed = variantSchema.safeParse({
    sku: (formData.get("sku") as string)?.trim(),
    color: (formData.get("color") as string)?.trim(),
    size: (formData.get("size") as string)?.trim(),
    material: (formData.get("material") as string)?.trim(),
    price_delta_amount: formData.get("price_delta_amount"),
    price_delta_currency: (formData.get("price_delta_currency") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const belongsToTenant = await productBelongsToTenant(supabase, productId, tenant.id);
  if (!belongsToTenant) return { error: "Producto no encontrado." };

  const { error } = await supabase.from("product_variants").insert({
    tenant_id: tenant.id,
    product_id: productId,
    sku: d.sku || null,
    color: d.color || null,
    size: d.size || null,
    material: d.material || null,
    price_delta_amount: d.price_delta_amount ?? null,
    price_delta_currency: d.price_delta_currency || "UYU",
    notes: d.notes || null,
  });

  if (error) return { error: "No se pudo agregar la variante." };

  revalidatePath(`/products/${productId}`);
  return { success: true };
}

export async function generateListingDraft(productId: string, provider: string) {
  const parsedProvider = z.enum(CHANNEL_PROVIDERS).safeParse(provider);
  if (!parsedProvider.success) return { error: "Canal inválido." };

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const [{ data: product }, { data: variants }] = await Promise.all([
    supabase
      .from("sellable_products")
      .select("*")
      .eq("id", productId)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase.from("product_variants").select("*").eq("product_id", productId),
  ]);

  if (!product) return { error: "Producto no encontrado." };

  const draft = buildListingDraft(
    parsedProvider.data as SalesChannelProvider,
    product,
    variants ?? []
  );

  const { data: listing, error } = await supabase
    .from("channel_listings")
    .insert({
      tenant_id: tenant.id,
      product_id: productId,
      provider: parsedProvider.data,
      status: "draft",
      title: draft.title,
      description: draft.description,
      price_amount: product.base_price_amount,
      price_currency: product.base_price_currency,
      suggested_tags: draft.suggested_tags,
      photo_checklist: draft.photo_checklist,
    })
    .select("*")
    .single();

  if (error || !listing) return { error: "No se pudo generar el borrador." };

  revalidatePath(`/products/${productId}`);
  return { success: true, listing };
}

export async function updateListingStatus(listingId: string, status: string, productId: string) {
  const parsed = z.enum(LISTING_STATUSES).safeParse(status);
  if (!parsed.success) return { error: "Estado inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("channel_listings")
    .update({ status: parsed.data })
    .eq("id", listingId);

  if (error) return { error: "No se pudo actualizar el estado." };

  revalidatePath(`/products/${productId}`);
  return { success: true };
}

export async function setListingExternalUrl(
  listingId: string,
  productId: string,
  formData: FormData
) {
  const url = (formData.get("external_url") as string)?.trim();
  const parsed = z.string().url("URL inválida.").safeParse(url);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "URL inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("channel_listings")
    .update({ external_url: parsed.data, last_synced_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) return { error: "No se pudo guardar la URL." };

  revalidatePath(`/products/${productId}`);
  return { success: true };
}
