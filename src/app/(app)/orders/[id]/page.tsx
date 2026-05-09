import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/features/orders/order-detail";
import { OrderActions } from "@/components/features/orders/order-actions";
import { FileList } from "@/components/features/files/file-list";
import { ModelOptionsSection } from "@/components/features/orders/model-options-section";
import { PrintJobsSection } from "@/components/features/orders/print-jobs-section";
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

  const [customerResult, filesResult, optionsResult, modelsResult, jobsResult, versionsResult] = await Promise.all([
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
    supabase
      .from("print_jobs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at"),
    supabase
      .from("model_versions")
      .select("*, models!inner(name)")
      .eq("models.tenant_id", tenant!.id)
      .order("version_number"),
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

      <PrintJobsSection
        orderId={order.id}
        orderQuantity={order.quantity}
        jobs={jobsResult.data ?? []}
        modelVersions={(versionsResult.data ?? []).map((v: { id: string; tenant_id: string; model_id: string; version_number: number; notes: string | null; created_at: string; models: { name: string } }) => ({
          ...v,
          model_name: v.models.name,
        }))}
      />
    </div>
  );
}
