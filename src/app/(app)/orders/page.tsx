import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/features/orders/order-status-badge";
import { OrderFilters } from "@/components/features/orders/order-filters";

const PAGE_SIZE = 20;
const URGENCY_LABELS: Record<string, string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baja",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const statuses = Array.isArray(searchParams.status)
    ? searchParams.status
    : searchParams.status
      ? [searchParams.status]
      : [];
  const urgency = (searchParams.urgency as string) ?? "";
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("orders")
    .select("*, customers(name)", { count: "exact" })
    .eq("tenant_id", tenant!.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statuses.length > 0) query = query.in("status", statuses);
  if (urgency) query = query.eq("urgency", urgency);

  const { data: orders, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders/board">Ver tablero</Link>
          </Button>
        </div>
        <Button asChild>
          <Link href="/orders/new">Nueva orden</Link>
        </Button>
      </div>

      <OrderFilters activeStatuses={statuses} activeUrgency={urgency} />

      {orders && orders.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Cant.</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const customerName = Array.isArray(order.customers)
                  ? (order.customers[0] as { name: string } | undefined)?.name
                  : (order.customers as { name: string } | null)?.name;
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customerName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {URGENCY_LABELS[order.urgency] ?? order.urgency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.charged_price_amount != null
                        ? `${order.charged_price_amount.toLocaleString("es-UY", {
                            minimumFractionDigits: 2,
                          })} ${order.charged_price_currency ?? "UYU"}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(order.created_at).toLocaleDateString("es-UY")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {from + 1}–{Math.min(to + 1, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                  <Link
                    href={`/orders?${new URLSearchParams({
                      ...(statuses.length ? { status: statuses.join(",") } : {}),
                      ...(urgency ? { urgency } : {}),
                      page: String(page - 1),
                    })}`}
                  >
                    Anterior
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={page >= totalPages}
                >
                  <Link
                    href={`/orders?${new URLSearchParams({
                      ...(statuses.length ? { status: statuses.join(",") } : {}),
                      ...(urgency ? { urgency } : {}),
                      page: String(page + 1),
                    })}`}
                  >
                    Siguiente
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No se encontraron ordenes con esos filtros.
        </p>
      )}
    </div>
  );
}
