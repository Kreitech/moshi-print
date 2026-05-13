"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createOrder } from "@/lib/actions/orders";
import { type Customer } from "@/types/database";
import { CustomerCombobox } from "./customer-combobox";

const URGENCY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
];

export function OrderForm({ customers }: { customers: Customer[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createOrder(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="max-w-lg">
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              autoFocus
              placeholder="Ej. Carcasa para proyecto X"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" />
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <CustomerCombobox customers={customers} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgencia</Label>
              <select
                id="urgency"
                name="urgency"
                defaultValue="normal"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {URGENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creando..." : "Crear pedido"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
