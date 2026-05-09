"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import { updateOrder } from "@/lib/actions/orders";
import { type Order, type Customer } from "@/types/database";

const URGENCY_LABELS = { low: "Baja", normal: "Normal", high: "Alta" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function OrderDetail({
  order: initial,
  customer,
}: {
  order: Order;
  customer: Customer | null;
}) {
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrder(order.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOrder({
          ...order,
          title: (formData.get("title") as string).trim(),
          description: (formData.get("description") as string)?.trim() || null,
          quantity: Number(formData.get("quantity")) || 1,
          urgency: (formData.get("urgency") as Order["urgency"]) ?? "normal",
          notes: (formData.get("notes") as string)?.trim() || null,
        });
        setEditing(false);
      }
    });
  }

  if (editing) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Editar pedido</CardTitle>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={order.title}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                defaultValue={order.description ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue={order.quantity}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgencia</Label>
                <select
                  id="urgency"
                  name="urgency"
                  defaultValue={order.urgency}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                name="notes"
                defaultValue={order.notes ?? ""}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{order.title}</CardTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {customer && (
          <Field
            label="Cliente"
            value={
              <Link
                href={`/customers/${customer.id}`}
                className="hover:underline"
              >
                {customer.name}
              </Link>
            }
          />
        )}
        <Field label="Descripción" value={order.description} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cantidad" value={String(order.quantity)} />
          <Field
            label="Urgencia"
            value={URGENCY_LABELS[order.urgency] ?? order.urgency}
          />
        </div>
        <Field label="Notas" value={order.notes} />
        <Field
          label="Creado"
          value={new Date(order.created_at).toLocaleDateString("es-UY")}
        />
      </CardContent>
    </Card>
  );
}
