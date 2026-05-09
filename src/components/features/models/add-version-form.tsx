"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addModelVersion } from "@/lib/actions/models";

export function AddVersionForm({ modelId }: { modelId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addModelVersion(modelId, formData);
      if (result?.error) setError(result.error);
      else {
        router.refresh();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Agregar version
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-4 max-w-sm">
      <div className="space-y-1">
        <Label className="text-xs">Notas de la version</Label>
        <Input name="notes" className="h-8 text-sm" placeholder="Cambios realizados..." autoFocus />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
