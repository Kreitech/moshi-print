"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProductVariant } from "@/lib/actions/products";
import { type ProductVariant } from "@/types/database";

export function ProductVariantsSection({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addProductVariant(productId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowForm(false);
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Variantes ({variants.length})</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "Agregar variante"}
        </Button>
      </div>

      {showForm && (
        <form action={handleSubmit} className="space-y-3 rounded-md border p-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input name="color" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tamaño</Label>
              <Input name="size" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Material</Label>
              <Input name="material" className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input name="sku" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ajuste de precio</Label>
              <Input
                name="price_delta_amount"
                type="number"
                step="0.01"
                className="h-8 text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Moneda</Label>
              <select
                name="price_delta_currency"
                defaultValue="UYU"
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
              >
                <option value="UYU">UYU</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Input name="notes" className="h-8 text-sm" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar variante"}
          </Button>
        </form>
      )}

      {variants.length > 0 ? (
        <div className="space-y-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center gap-3 rounded-md border px-4 py-2 text-sm"
            >
              {v.color && <span>Color: {v.color}</span>}
              {v.size && <span>Tamaño: {v.size}</span>}
              {v.material && <span>Material: {v.material}</span>}
              {v.sku && <span className="text-muted-foreground text-xs">SKU: {v.sku}</span>}
              {v.price_delta_amount != null && (
                <span className="text-muted-foreground text-xs">
                  +{v.price_delta_amount} {v.price_delta_currency ?? "UYU"}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin variantes registradas.</p>
      )}
    </section>
  );
}
