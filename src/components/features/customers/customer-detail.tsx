"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCustomer } from "@/lib/actions/customers";
import { type Customer } from "@/types/database";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function CustomerDetail({ customer: initial }: { customer: Customer }) {
  const [editing, setEditing] = useState(false);
  const [customer, setCustomer] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateCustomer(customer.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setCustomer({
          ...customer,
          name: (formData.get("name") as string).trim(),
          email: (formData.get("email") as string)?.trim() || null,
          phone: (formData.get("phone") as string)?.trim() || null,
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
          <CardTitle>Editar cliente</CardTitle>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={customer.name}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={customer.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                name="notes"
                defaultValue={customer.notes ?? ""}
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{customer.name}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Correo electrónico" value={customer.email} />
        <Field label="Teléfono" value={customer.phone} />
        <Field label="Notas" value={customer.notes} />
      </CardContent>
    </Card>
  );
}
