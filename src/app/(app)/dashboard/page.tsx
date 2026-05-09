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

export default async function DashboardPage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: orders } = await supabase
    .from("orders")
    .select("status")
    .eq("tenant_id", tenant!.id);

  const countByStatus: Record<string, number> = {};
  for (const o of orders ?? []) {
    countByStatus[o.status] = (countByStatus[o.status] ?? 0) + 1;
  }

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
    </div>
  );
}
