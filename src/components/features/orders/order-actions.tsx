"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { transitionOrderStatus } from "@/lib/actions/orders";
import {
  type OrderStatus,
  ORDER_STATUS_LABELS,
  getAllowedTransitions,
} from "@/lib/order-transitions";

const FACTORY_TRIGGER_STATUSES: OrderStatus[] = [
  "new",
  "researching",
  "pending_approval",
  "failed_or_reprint",
];
const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export function OrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function transition(next: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await transitionOrderStatus(orderId, next);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  if (TERMINAL_STATUSES.includes(currentStatus)) return null;

  const allowed = getAllowedTransitions(currentStatus);
  const showFactory = FACTORY_TRIGGER_STATUSES.includes(currentStatus);
  const otherTransitions = allowed.filter((s) => s !== "ready_for_factory");

  return (
    <div className="space-y-2">
      {showFactory && (
        <Button
          onClick={() => transition("ready_for_factory")}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? "Enviando..." : "Enviar a fábrica"}
        </Button>
      )}

      {otherTransitions.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Cambiar estado:
          </label>
          <select
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm disabled:opacity-50"
            defaultValue=""
            disabled={isPending}
            onChange={(e) => {
              if (e.target.value) transition(e.target.value as OrderStatus);
            }}
          >
            <option value="" disabled>
              Seleccionar...
            </option>
            {otherTransitions.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
