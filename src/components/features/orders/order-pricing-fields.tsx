import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Order } from "@/types/database";

const CURRENCY_OPTIONS = ["UYU", "USD"];

export const PAYMENT_STATUS_LABELS: Record<Order["payment_status"], string> = {
  not_tracked: "Sin seguimiento",
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
};

const PAYMENT_STATUS_OPTIONS = (
  Object.keys(PAYMENT_STATUS_LABELS) as Order["payment_status"][]
).map((value) => ({ value, label: PAYMENT_STATUS_LABELS[value] }));

// Optional pricing section shared by the order create and edit forms.
export function OrderPricingFields({ order }: { order?: Order }) {
  return (
    <details className="rounded-md border px-4 py-3" open={!!order?.charged_price_amount}>
      <summary className="cursor-pointer text-sm font-medium">
        Precio / facturación (opcional)
      </summary>
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="charged_price_amount">Precio cobrado</Label>
            <Input
              id="charged_price_amount"
              name="charged_price_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={order?.charged_price_amount ?? ""}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="charged_price_currency">Moneda</Label>
            <select
              id="charged_price_currency"
              name="charged_price_currency"
              defaultValue={order?.charged_price_currency ?? "UYU"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="charged_price_notes">Notas de precio</Label>
          <Input
            id="charged_price_notes"
            name="charged_price_notes"
            defaultValue={order?.charged_price_notes ?? ""}
            placeholder="Ej. incluye envío, descuento por volumen..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_status">Estado de pago</Label>
          <select
            id="payment_status"
            name="payment_status"
            defaultValue={order?.payment_status ?? "not_tracked"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {PAYMENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </details>
  );
}
