import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { PrinterCrud } from "@/components/features/settings/printer-crud";

export default async function PrintersPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: printers } = await supabase
    .from("printers")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .order("name");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Impresoras</h1>
      <PrinterCrud printers={printers ?? []} />
    </div>
  );
}
