import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/features/orders/order-detail";
import { OrderActions } from "@/components/features/orders/order-actions";
import { FileList } from "@/components/features/files/file-list";
import { type OrderStatus } from "@/lib/order-transitions";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  const [customerResult, filesResult] = await Promise.all([
    order.customer_id
      ? supabase.from("customers").select("*").eq("id", order.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("files")
      .select("*")
      .eq("entity_type", "order")
      .eq("entity_id", order.id)
      .order("created_at"),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">← Pedidos</Link>
        </Button>
      </div>

      <OrderDetail order={order} customer={customerResult.data} />
      <OrderActions
        orderId={order.id}
        currentStatus={order.status as OrderStatus}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Archivos</h2>
        <FileList
          initialFiles={filesResult.data ?? []}
          entityType="order"
          entityId={order.id}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Opciones de modelo</h2>
        <p className="text-sm text-muted-foreground">
          Sin opciones de modelo registradas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Trabajos de impresión</h2>
        <p className="text-sm text-muted-foreground">
          Sin trabajos de impresión registrados.
        </p>
      </section>
    </div>
  );
}
