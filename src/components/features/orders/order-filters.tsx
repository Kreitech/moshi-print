"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-transitions";

const ALL_STATUSES: OrderStatus[] = [
  "new", "researching", "pending_approval", "ready_for_factory",
  "printing", "post_processing", "ready_to_deliver", "delivered",
  "failed_or_reprint", "cancelled",
];

export function OrderFilters({
  activeStatuses,
  activeUrgency,
}: {
  activeStatuses: string[];
  activeUrgency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string | string[]) {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    if (Array.isArray(value)) {
      value.forEach((v) => next.append(key, v));
    } else if (value) {
      next.set(key, value);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function toggleStatus(s: OrderStatus) {
    const next = activeStatuses.includes(s)
      ? activeStatuses.filter((x) => x !== s)
      : [...activeStatuses, s];
    update("status", next);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex flex-wrap gap-1.5">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
              activeStatuses.includes(s)
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground"
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <select
        value={activeUrgency}
        onChange={(e) => update("urgency", e.target.value)}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
      >
        <option value="">Todas las urgencias</option>
        <option value="high">Alta</option>
        <option value="normal">Normal</option>
        <option value="low">Baja</option>
      </select>

      {(activeStatuses.length > 0 || activeUrgency) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
