import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { CustomerList } from "@/components/features/customers/customer-list";

export default async function CustomersPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .order("name");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild>
          <Link href="/customers/new">Nuevo cliente</Link>
        </Button>
      </div>

      <CustomerList customers={customers ?? []} />
    </div>
  );
}
