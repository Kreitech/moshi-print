"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

export async function saveAttemptAsProfile(attemptId: string, formData: FormData) {
  const name = formData.get("name") as string | null;
  if (!name || name.trim().length === 0) {
    return { error: "El nombre del perfil es requerido." };
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return { error: "Sin espacio de trabajo." };

  const { data: attempt } = await supabase
    .from("print_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!attempt) return { error: "Intento no encontrado." };
  if (attempt.result !== "success") return { error: "Solo se pueden guardar intentos exitosos." };
  if (attempt.saved_as_profile_id) return { error: "Ya existe un perfil guardado para este intento." };

  let profileSettings: Record<string, unknown> = {};
  if (attempt.print_profile_id) {
    const { data: sourceProfile } = await supabase
      .from("print_profiles")
      .select(
        "layer_height_mm, nozzle_temp, bed_temp, print_speed_mm_s, wall_count, infill_pct, supports, brim_raft_skirt, exposure_time_s, bottom_exposure_time_s, lift_speed_mm_s, resin_layer_height_mm, supports_notes"
      )
      .eq("id", attempt.print_profile_id)
      .maybeSingle();

    if (sourceProfile) {
      profileSettings = sourceProfile;
    }
  }

  const { data: newProfile, error: profileError } = await supabase
    .from("print_profiles")
    .insert({
      tenant_id: tenant.id,
      name: name.trim(),
      printer_id: attempt.printer_id,
      material_id: attempt.material_id,
      notes: `Guardado desde intento ${attemptId.slice(0, 8)}`,
      ...profileSettings,
    })
    .select("id, name")
    .single();

  if (profileError) return { error: "No se pudo crear el perfil." };

  const { error: updateError } = await supabase
    .from("print_attempts")
    .update({ saved_as_profile_id: newProfile.id })
    .eq("id", attemptId);

  if (updateError) return { error: "Perfil creado pero no se pudo vincular al intento." };

  return { success: true, profileId: newProfile.id, profileName: newProfile.name };
}
