"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createModel, updateModel } from "@/lib/actions/models";
import { type Model, type ModelStatus } from "@/types/database";

const STATUS_OPTIONS: { value: ModelStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "researching", label: "Investigando" },
  { value: "ready_to_test", label: "Listo para probar" },
  { value: "tested_ok", label: "Probado OK" },
  { value: "needs_adjustments", label: "Necesita ajustes" },
  { value: "production_ready", label: "Listo produccion" },
  { value: "discarded", label: "Descartado" },
];

export function ModelForm({ initial }: { initial?: Model }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = initial
        ? await updateModel(initial.id, formData)
        : await createModel(formData);
      if (result?.error) {
        setError(result.error);
      } else if (!initial && "id" in result) {
        router.push(`/models/${result.id}`);
      } else {
        router.push(`/models/${initial!.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Nombre *</Label>
          <Input
            name="name"
            required
            autoFocus
            defaultValue={initial?.name}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Estado</Label>
          <select
            name="status"
            defaultValue={initial?.status ?? "idea"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Plataforma fuente</Label>
          <Input
            name="source_platform"
            defaultValue={initial?.source_platform ?? ""}
            placeholder="Printables, Thingiverse..."
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripcion</Label>
        <Input
          name="description"
          defaultValue={initial?.description ?? ""}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">URL fuente</Label>
        <Input
          name="source_url"
          type="url"
          defaultValue={initial?.source_url ?? ""}
          placeholder="https://..."
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Licencia</Label>
          <Input
            name="license"
            defaultValue={initial?.license ?? ""}
            placeholder="CC BY-SA 4.0"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Uso comercial</Label>
          <select
            name="commercial_use_allowed"
            defaultValue={
              initial?.commercial_use_allowed === true
                ? "true"
                : initial?.commercial_use_allowed === false
                ? "false"
                : ""
            }
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="">—</option>
            <option value="true">Si</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Atribucion</Label>
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

      <div className="space-y-1">
        <Label className="text-xs">Tags (separados por coma)</Label>
        <Input
          name="tags"
          defaultValue={initial?.tags?.join(", ") ?? ""}
          placeholder="figurina, soporte, pieza..."
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Input name="notes" defaultValue={initial?.notes ?? ""} className="h-8 text-sm" />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
