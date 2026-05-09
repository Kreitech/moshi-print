import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { PrintProfileCrud } from "@/components/features/settings/print-profile-crud";

export default async function PrintProfilesPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const [profilesRes, printersRes, materialsRes] = await Promise.all([
    supabase.from("print_profiles").select("*").eq("tenant_id", tenant!.id).order("name"),
    supabase.from("printers").select("*").eq("tenant_id", tenant!.id).order("name"),
    supabase.from("materials").select("*").eq("tenant_id", tenant!.id).order("name"),
  ]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Perfiles de impresion</h1>
      <PrintProfileCrud
        profiles={profilesRes.data ?? []}
        printers={printersRes.data ?? []}
        materials={materialsRes.data ?? []}
      />
    </div>
  );
}
