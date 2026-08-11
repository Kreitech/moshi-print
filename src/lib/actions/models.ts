"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

export type ModelStatus =
  | "idea"
  | "researching"
  | "ready_to_test"
  | "tested_ok"
  | "needs_adjustments"
  | "production_ready"
  | "discarded";

const MODEL_STATUSES: [ModelStatus, ...ModelStatus[]] = [
  "idea",
  "researching",
  "ready_to_test",
  "tested_ok",
  "needs_adjustments",
  "production_ready",
  "discarded",
];

export const SOURCE_PLATFORMS = [
  "printables",
  "thingiverse",
  "makerworld",
  "cults3d",
  "etsy",
  "own_design",
  "customer_provided",
  "other",
] as const;

const modelSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().optional(),
  status: z.enum(MODEL_STATUSES).default("idea"),
  tags: z.string().optional(),
  notes: z.string().optional(),
  source_url: z.string().url("URL invalida.").optional().or(z.literal("")),
  source_platform: z.enum(SOURCE_PLATFORMS).optional().or(z.literal("")),
  creator: z.string().optional(),
  license: z.string().optional(),
  license_evidence: z.string().optional(),
  commercial_use_allowed: z.enum(["true", "false"]).optional(),
  attribution_required: z.enum(["true", "false"]).optional(),
  attribution_text: z.string().optional(),
  license_notes: z.string().optional(),
});

// commercial_use_verification_status is intentionally NOT part of this
// schema — it always starts "pending" (DB default) and can only move to
// "verified"/"rejected" through an explicit verification action, not via
// the general create/edit model form.

export async function createModel(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = modelSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "No autenticado." };

  const d = parsed.data;
  const tags = d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const { data, error } = await supabase
    .from("models")
    .insert({
      tenant_id: tenant.id,
      name: d.name,
      description: d.description || null,
      status: d.status,
      tags,
      notes: d.notes || null,
      source_url: d.source_url || null,
      source_platform: d.source_platform || null,
      creator: d.creator || null,
      license: d.license || null,
      license_evidence: d.license_evidence || null,
      commercial_use_allowed:
        d.commercial_use_allowed === "true"
          ? true
          : d.commercial_use_allowed === "false"
          ? false
          : null,
      attribution_required:
        d.attribution_required === "true"
          ? true
          : d.attribution_required === "false"
          ? false
          : null,
      attribution_text: d.attribution_text || null,
      license_notes: d.license_notes || null,
      created_by: user.user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el modelo." };
  return { success: true, id: data.id };
}

export async function updateModel(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = modelSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const d = parsed.data;
  const tags = d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const { error } = await supabase
    .from("models")
    .update({
      name: d.name,
      description: d.description || null,
      status: d.status,
      tags,
      notes: d.notes || null,
      source_url: d.source_url || null,
      source_platform: d.source_platform || null,
      creator: d.creator || null,
      license: d.license || null,
      license_evidence: d.license_evidence || null,
      commercial_use_allowed:
        d.commercial_use_allowed === "true"
          ? true
          : d.commercial_use_allowed === "false"
          ? false
          : null,
      attribution_required:
        d.attribution_required === "true"
          ? true
          : d.attribution_required === "false"
          ? false
          : null,
      attribution_text: d.attribution_text || null,
      license_notes: d.license_notes || null,
    })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el modelo." };
  return { success: true };
}

export async function addModelVersion(modelId: string, formData: FormData) {
  const notes = formData.get("notes") as string | null;

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: existing } = await supabase
    .from("model_versions")
    .select("version_number")
    .eq("model_id", modelId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (existing?.version_number ?? 0) + 1;

  const { error } = await supabase.from("model_versions").insert({
    tenant_id: tenant.id,
    model_id: modelId,
    version_number: nextVersion,
    notes: notes || null,
  });

  if (error) return { error: "No se pudo agregar la version." };
  return { success: true, version: nextVersion };
}
