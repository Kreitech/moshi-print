import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

const KPI_CARDS = [
  {
    status: "ready_for_factory",
    label: "Esperando produccion",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    countColor: "text-yellow-700",
  },
  {
    status: "printing",
    label: "En impresion",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    countColor: "text-blue-700",
  },
  {
    status: "failed_or_reprint",
    label: "Fallo / Reimprimir",
    color: "bg-red-50 border-red-200 text-red-700",
    countColor: "text-red-700",
  },
  {
    status: "ready_to_deliver",
    label: "Listo para entregar",
    color: "bg-green-50 border-green-200 text-green-700",
    countColor: "text-green-700",
  },
] as const;

const URGENCY_ORDER = { high: 0, normal: 1, low: 2 } as const;

const URGENCY_LABELS: Record<string, string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baja",
};

const URGENCY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  normal: "bg-slate-100 text-slate-600",
  low: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  ready_for_factory: "En cola",
  printing: "Imprimiendo",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const [ordersRes, queueRes] = await Promise.all([
    supabase.from("orders").select("status").eq("tenant_id", tenant!.id),
    supabase
      .from("orders")
      .select("id, title, urgency, status, customer_id")
      .eq("tenant_id", tenant!.id)
      .in("status", ["ready_for_factory", "printing"])
      .order("created_at", { ascending: true }),
  ]);

  const countByStatus: Record<string, number> = {};
  for (const o of ordersRes.data ?? []) {
    countByStatus[o.status] = (countByStatus[o.status] ?? 0) + 1;
  }

  const queueOrders = (queueRes.data ?? [])
    .sort((a, b) => {
      const ua = URGENCY_ORDER[a.urgency as keyof typeof URGENCY_ORDER] ?? 1;
      const ub = URGENCY_ORDER[b.urgency as keyof typeof URGENCY_ORDER] ?? 1;
      return ua - ub;
    })
    .slice(0, 10);

  const customerIds = Array.from(new Set(queueOrders.map((o) => o.customer_id).filter(Boolean)));
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("id, name").in("id", customerIds)
    : { data: [] };
  const customerMap = new Map((customers ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Panel de control</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <Link
            key={card.status}
            href={`/orders?status=${card.status}`}
            className={`rounded-lg border-2 p-4 space-y-1 transition-opacity hover:opacity-80 ${card.color}`}
          >
            <p className={`text-3xl font-bold ${card.countColor}`}>
              {countByStatus[card.status] ?? 0}
            </p>
            <p className="text-xs font-medium leading-tight">{card.label}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Cola de produccion</h2>
          <Link href="/orders/board" className="text-xs text-muted-foreground hover:underline">
            Ver todos →
          </Link>
        </div>

        {queueOrders.length > 0 ? (
          <div className="space-y-2">
            {queueOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border px-4 py-2 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      URGENCY_COLORS[order.urgency] ?? "bg-muted"
                    }`}
                  >
                    {URGENCY_LABELS[order.urgency] ?? order.urgency}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{order.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer_id ? customerMap.get(order.customer_id) ?? "—" : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-xs font-medium hover:underline"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay ordenes pendientes en produccion.
          </p>
        )}
      </section>
    </div>
  );
}
