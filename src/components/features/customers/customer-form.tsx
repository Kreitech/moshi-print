"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createCustomer } from "@/lib/actions/customers";

export function CustomerForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCustomer(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card className="max-w-lg">
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Crear cliente"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
