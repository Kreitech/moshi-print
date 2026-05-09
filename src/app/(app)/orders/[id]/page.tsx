import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/features/orders/order-detail";

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

  let customer = null;
  if (order.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("id", order.customer_id)
      .maybeSingle();
    customer = data;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">← Pedidos</Link>
        </Button>
      </div>

      <OrderDetail order={order} customer={customer} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Archivos</h2>
        <p className="text-sm text-muted-foreground">
          Sin archivos adjuntos. Pega un enlace de Google Drive.
        </p>
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
