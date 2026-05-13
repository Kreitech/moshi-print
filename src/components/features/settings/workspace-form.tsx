"use client";

import { useState, useTransition } from "react";
import { updateTenant } from "@/lib/actions/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialName: string;
  slug: string;
}

export function WorkspaceForm({ initialName, slug }: Props) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData();
    fd.append("name", name);
    startTransition(async () => {
      const result = await updateTenant(fd);
      if (result?.error) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Nombre</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess(false);
          }}
          required
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">Identificador (slug)</p>
        <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">{slug}</p>
        <p className="text-xs text-muted-foreground">
          El identificador se usa en las URLs y no se puede cambiar.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Guardado correctamente.
        </p>
      )}

      <Button type="submit" disabled={isPending || name === initialName}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
