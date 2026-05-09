import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/features/orders/kanban-board";

export default async function OrdersBoardPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  // Fetch orders with customer name in a single query
  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(name)")
    .eq("tenant_id", tenant!.id)
    .order("created_at", { ascending: false });

  const flat = (orders ?? []).map((o) => ({
    ...o,
    customer_name: Array.isArray(o.customers)
      ? (o.customers[0] as { name: string } | undefined)?.name ?? null
      : (o.customers as { name: string } | null)?.name ?? null,
    customers: undefined,
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Tablero</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders">Vista lista</Link>
          </Button>
        </div>
        <Button asChild>
          <Link href="/orders/new">Nueva orden</Link>
        </Button>
      </div>
      <KanbanBoard orders={flat} />
    </div>
  );
}
