import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { StorageSettings } from "@/components/features/settings/storage-settings";

export default async function StoragePage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: connection } = await supabase
    .from("tenant_storage_connections")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .eq("provider", "google_drive")
    .maybeSingle();

  return <StorageSettings connection={connection} />;
}
