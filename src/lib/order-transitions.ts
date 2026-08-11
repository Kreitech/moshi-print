export type OrderStatus =
  | "new"
  | "researching"
  | "pending_approval"
  | "ready_for_factory"
  | "printing"
  | "post_processing"
  | "ready_to_deliver"
  | "delivered"
  | "failed_or_reprint"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nuevo",
  researching: "Investigando",
  pending_approval: "Pendiente de aprobación",
  ready_for_factory: "Listo para fábrica",
  printing: "Imprimiendo",
  post_processing: "Post-procesando",
  ready_to_deliver: "Listo para entregar",
  delivered: "Entregado",
  failed_or_reprint: "Fallido / Reimprimir",
  cancelled: "Cancelado",
};

// Allowed transitions per ADR-02
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["researching", "ready_for_factory", "cancelled"],
  researching: ["pending_approval", "ready_for_factory", "cancelled"],
  pending_approval: ["ready_for_factory", "researching", "cancelled"],
  ready_for_factory: ["printing", "cancelled"],
  printing: ["post_processing", "failed_or_reprint"],
  post_processing: ["ready_to_deliver"],
  ready_to_deliver: ["delivered"],
  delivered: [],
  failed_or_reprint: ["ready_for_factory", "post_processing"],
  cancelled: [],
};

export function getAllowedTransitions(status: OrderStatus): OrderStatus[] {
  return TRANSITIONS[status] ?? [];
}

export function isValidTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
