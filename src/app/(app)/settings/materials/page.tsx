import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { MaterialCrud } from "@/components/features/settings/material-crud";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .order("name");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Materiales</h1>
      <MaterialCrud materials={materials ?? []} />
    </div>
  );
}
