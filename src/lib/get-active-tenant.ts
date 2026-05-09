import { type SupabaseClient } from "@supabase/supabase-js";
import { type Tenant } from "@/types/database";

/**
 * Returns the first tenant the current user belongs to.
 * Returns null if the user has no tenant membership.
 * Uses RLS — only tenants visible to auth.uid() are returned.
 */
export async function getActiveTenant(
  supabase: SupabaseClient
): Promise<Tenant | null> {
  const { data } = await supabase
    .from("tenants")
    .select("id, name, slug, created_at")
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
