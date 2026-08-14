"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { type SellableProduct } from "@/types/database";

const STATUS_OPTIONS: { value: SellableProduct["status"]; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "ready", label: "Listo" },
  { value: "published", label: "Publicado" },
  { value: "paused", label: "Pausado" },
  { value: "archived", label: "Archivado" },
];

const STOCK_MODE_OPTIONS: { value: SellableProduct["stock_mode"]; label: string }[] = [
  { value: "made_to_order", label: "Bajo pedido" },
  { value: "in_stock", label: "En stock" },
];

export type ProductPrefill = {
  model_id: string;
  name: string;
  description: string | null;
  commercial_use_allowed: boolean | null;
};

export function ProductForm({
  initial,
  prefill,
}: {
  initial?: SellableProduct;
  prefill?: ProductPrefill;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = initial
        ? await updateProduct(initial.id, formData)
        : await createProduct(formData);
      if (result?.error) {
        setError(result.error);
      } else if (initial) {
        router.push(`/products/${initial.id}`);
        router.refresh();
      }
      // createProduct redirects server-side on success
    });
  }

  const commercialDefault =
    initial?.commercial_use_allowed ?? prefill?.commercial_use_allowed;

  return (
    <form action={handleSubmit} className="space-y-4 max-w-lg">
      {prefill && <input type="hidden" name="model_id" value={prefill.model_id} />}

      <div className="space-y-1">
        <Label className="text-xs">Nombre *</Label>
        <Input
          name="name"
          required
          autoFocus
          defaultValue={initial?.name ?? prefill?.name ?? ""}
          className="h-8 text-sm"
          placeholder="Ej. Cartera 3D personalizada - color a elección"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Input
          name="description"
          defaultValue={initial?.description ?? prefill?.description ?? ""}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Precio base</Label>
          <Input
            name="base_price_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial?.base_price_amount ?? ""}
            className="h-8 text-sm"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Moneda</Label>
          <select
            name="base_price_currency"
            defaultValue={initial?.base_price_currency ?? "UYU"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="UYU">UYU</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Costo de producción</Label>
          <Input
            name="production_cost_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initial?.production_cost_amount ?? ""}
            className="h-8 text-sm"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Moneda</Label>
          <select
            name="production_cost_currency"
            defaultValue={initial?.production_cost_currency ?? "UYU"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="UYU">UYU</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Estado</Label>
          <select
            name="status"
            defaultValue={initial?.status ?? "draft"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Stock</Label>
          <select
            name="stock_mode"
            defaultValue={initial?.stock_mode ?? "made_to_order"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            {STOCK_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tiempo de entrega (días)</Label>
          <Input
            name="lead_time_days"
            type="number"
            min="0"
            defaultValue={initial?.lead_time_days ?? ""}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Cantidad disponible (si es en stock)</Label>
        <Input
          name="available_quantity"
          type="number"
          min="0"
          defaultValue={initial?.available_quantity ?? ""}
          className="h-8 text-sm"
        />
      </div>

      <fieldset className="space-y-3 rounded-md border px-3 py-3">
        <legend className="px-1 text-xs font-medium">Licencia comercial</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Uso comercial permitido</Label>
            <select
              name="commercial_use_allowed"
              defaultValue={
                commercialDefault === true ? "true" : commercialDefault === false ? "false" : ""
              }
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
            >
              <option value="">—</option>
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Atribución</Label>
            <select
              name="attribution_required"
              defaultValue={
                initial?.attribution_required === true
                  ? "true"
                  : initial?.attribution_required === false
                  ? "false"
                  : ""
              }
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
            >
              <option value="">—</option>
              <option value="true">Requerida</option>
              <option value="false">No requerida</option>
            </select>
          </div>
        </div>
        {commercialDefault !== true && (
          <p className="text-xs text-yellow-700">
            No está confirmada la licencia comercial de este modelo. Para marcar el
            producto como &quot;Listo&quot; o &quot;Publicado&quot; vas a necesitar
            confirmarla o dejar una nota de licencia explicando la excepción.
          </p>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Notas de licencia</Label>
          <Input
            name="license_notes"
            defaultValue={initial?.license_notes ?? ""}
            className="h-8 text-sm"
          />
        </div>
      </fieldset>

      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Input name="notes" defaultValue={initial?.notes ?? ""} className="h-8 text-sm" />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
