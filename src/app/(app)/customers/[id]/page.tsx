import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CustomerDetail } from "@/components/features/customers/customer-detail";
import { OrderStatusBadge } from "@/components/features/orders/order-status-badge";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const [{ data: customer }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("orders")
      .select("id, title, status, urgency, created_at")
      .eq("customer_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  // RLS returns null if customer belongs to a different tenant
  if (!customer) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">← Clientes</Link>
        </Button>
      </div>

      <CustomerDetail customer={customer} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Pedidos {orders && orders.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({orders.length})</span>
          )}
        </h2>
        {!orders || orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay pedidos para este cliente.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">{order.title}</span>
                  <OrderStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
