"use client";

import Link from "next/link";
import {
  type OrderStatus,
  ORDER_STATUS_LABELS,
} from "@/lib/order-transitions";
import { type Order } from "@/types/database";

const ALL_STATUSES: OrderStatus[] = [
  "new",
  "researching",
  "pending_approval",
  "ready_for_factory",
  "printing",
  "post_processing",
  "ready_to_deliver",
  "delivered",
  "failed_or_reprint",
  "cancelled",
];

const URGENCY_DOT: Record<string, string> = {
  high: "bg-red-500",
  normal: "bg-yellow-400",
  low: "bg-green-400",
};

type OrderWithCustomer = Order & { customer_name?: string | null };

export function KanbanBoard({
  orders,
}: {
  orders: OrderWithCustomer[];
}) {
  const byStatus = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, orders.filter((o) => o.status === s)])
  ) as Record<OrderStatus, OrderWithCustomer[]>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ALL_STATUSES.map((status) => {
        const column = byStatus[status];
        return (
          <div
            key={status}
            className="flex-none w-64 rounded-lg bg-muted/40 p-3 space-y-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {ORDER_STATUS_LABELS[status]}
              </span>
              <span className="text-xs text-muted-foreground">
                {column.length}
              </span>
            </div>

            {column.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sin órdenes
              </p>
            ) : (
              column.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-md bg-background p-3 shadow-sm hover:shadow-md transition-shadow space-y-1.5"
                >
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {order.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer_name ?? "Sin cliente"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      ×{order.quantity}
                    </span>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${URGENCY_DOT[order.urgency] ?? "bg-slate-300"}`}
                      title={order.urgency}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
