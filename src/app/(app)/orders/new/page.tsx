import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { OrderForm } from "@/components/features/orders/order-form";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .order("name");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">← Pedidos</Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo pedido</h1>
      </div>
      <OrderForm customers={customers ?? []} />
    </div>
  );
}
