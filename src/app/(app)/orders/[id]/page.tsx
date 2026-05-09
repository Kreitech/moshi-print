import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/features/orders/order-detail";
import { OrderActions } from "@/components/features/orders/order-actions";
import { FileList } from "@/components/features/files/file-list";
import { ModelOptionsSection } from "@/components/features/orders/model-options-section";
import { type OrderStatus } from "@/lib/order-transitions";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant!.id)
    .maybeSingle();

  if (!order) notFound();

  const [customerResult, filesResult, optionsResult, modelsResult] = await Promise.all([
    order.customer_id
      ? supabase.from("customers").select("*").eq("id", order.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("files")
      .select("*")
      .eq("entity_type", "order")
      .eq("entity_id", order.id)
      .order("created_at"),
    supabase
      .from("order_model_options")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at"),
    supabase
      .from("models")
      .select("*")
      .eq("tenant_id", tenant!.id)
      .order("name"),
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

      <ModelOptionsSection
        orderId={order.id}
        options={optionsResult.data ?? []}
        models={modelsResult.data ?? []}
      />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Trabajos de impresion</h2>
        <p className="text-sm text-muted-foreground">
          Sin trabajos de impresion registrados.
        </p>
      </section>
    </div>
  );
}
