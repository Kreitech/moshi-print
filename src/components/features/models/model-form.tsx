"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createModel, updateModel, SOURCE_PLATFORMS } from "@/lib/actions/models";
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

const SOURCE_PLATFORM_LABELS: Record<(typeof SOURCE_PLATFORMS)[number], string> = {
  printables: "Printables",
  thingiverse: "Thingiverse",
  makerworld: "MakerWorld",
  cults3d: "Cults3D",
  etsy: "Etsy",
  own_design: "Diseño propio",
  customer_provided: "Provisto por el cliente",
  other: "Otro",
};

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
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripcion</Label>
        <Input
          name="description"
          defaultValue={initial?.description ?? ""}
          className="h-8 text-sm"
        />
      </div>

      <fieldset className="space-y-3 rounded-md border px-3 py-3">
        <legend className="px-1 text-xs font-medium">Fuente y licencia</legend>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Plataforma fuente</Label>
            <select
              name="source_platform"
              defaultValue={initial?.source_platform ?? ""}
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
            >
              <option value="">—</option>
              {SOURCE_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {SOURCE_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
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
          <Label className="text-xs">Texto de atribucion</Label>
          <Input
            name="attribution_text"
            defaultValue={initial?.attribution_text ?? ""}
            placeholder='Ej. "Diseño por Fulano, cults3d.com/..."'
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Notas de licencia</Label>
          <Input
            name="license_notes"
            defaultValue={initial?.license_notes ?? ""}
            className="h-8 text-sm"
          />
        </div>
      </fieldset>

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
