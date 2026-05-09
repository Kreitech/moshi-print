"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { type FileEntityType, type FileType } from "@/types/database";

const fileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  file_type: z.enum(["stl", "image", "gcode", "pdf", "sliced", "reference", "other"]),
  gdrive_url: z
    .string()
    .url("URL inválida.")
    .startsWith("https://drive.google.com", "Debe ser un enlace de Google Drive.")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export async function addFileReference(
  entityType: FileEntityType,
  entityId: string,
  formData: FormData
) {
  const raw = {
    name: (formData.get("name") as string)?.trim(),
    file_type: formData.get("file_type"),
    gdrive_url: (formData.get("gdrive_url") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  };

  const parsed = fileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { error } = await supabase.from("files").insert({
    tenant_id: tenant.id,
    entity_type: entityType,
    entity_id: entityId,
    name: parsed.data.name,
    file_type: parsed.data.file_type as FileType,
    gdrive_url: parsed.data.gdrive_url || null,
    notes: parsed.data.notes || null,
    uploaded_by: user.id,
  });

  if (error) return { error: "No se pudo guardar el archivo." };
  return { success: true };
}
