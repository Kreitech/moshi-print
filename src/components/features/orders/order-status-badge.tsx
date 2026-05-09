import { cn } from "@/lib/utils";
import { type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-transitions";

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  researching: "bg-blue-100 text-blue-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  ready_for_factory: "bg-orange-100 text-orange-700",
  printing: "bg-purple-100 text-purple-700",
  post_processing: "bg-teal-100 text-teal-700",
  ready_to_deliver: "bg-green-100 text-green-700",
  delivered: "bg-green-200 text-green-800",
  failed_or_reprint: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status as OrderStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {ORDER_STATUS_LABELS[key] ?? status}
    </span>
  );
}
