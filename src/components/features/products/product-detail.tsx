"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductStatusBadge } from "./product-status-badge";
import { ProductForm } from "./product-form";
import { type SellableProduct } from "@/types/database";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function ProductDetail({ product }: { product: SellableProduct }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Editar producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm initial={product} />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{product.name}</CardTitle>
          <ProductStatusBadge status={product.status} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Descripción" value={product.description} />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Precio base"
            value={
              product.base_price_amount != null
                ? `${product.base_price_amount.toLocaleString("es-UY", {
                    minimumFractionDigits: 2,
                  })} ${product.base_price_currency ?? "UYU"}`
                : null
            }
          />
          <Field
            label="Costo de producción"
            value={
              product.production_cost_amount != null
                ? `${product.production_cost_amount.toLocaleString("es-UY", {
                    minimumFractionDigits: 2,
                  })} ${product.production_cost_currency ?? "UYU"}`
                : null
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Stock"
            value={product.stock_mode === "in_stock" ? "En stock" : "Bajo pedido"}
          />
          <Field
            label="Tiempo de entrega"
            value={product.lead_time_days != null ? `${product.lead_time_days} días` : null}
          />
        </div>
        {product.commercial_use_allowed !== null && (
          <Field
            label="Uso comercial"
            value={product.commercial_use_allowed ? "Permitido" : "No permitido"}
          />
        )}
        <Field label="Notas" value={product.notes} />
      </CardContent>
    </Card>
  );
}
