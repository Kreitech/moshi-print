"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createTenant } from "@/lib/actions/tenants";

export function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTenant(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del espacio de trabajo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Moshicrea"
              required
              autoComplete="organization"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creando..." : "Crear espacio de trabajo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
