"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addModelOption,
  selectModelOption,
  removeModelOption,
} from "@/lib/actions/order-model-options";
import { saveOptionToLibrary } from "@/lib/actions/save-to-library";
import { type OrderModelOption, type Model } from "@/types/database";

function AddOptionForm({
  orderId,
  models,
  onDone,
}: {
  orderId: string;
  models: Model[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addModelOption(orderId, formData);
      if (result?.error) setError(result.error);
      else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-4 max-w-md">
      <div className="space-y-1">
        <Label className="text-xs">Titulo *</Label>
        <Input name="title" required autoFocus className="h-8 text-sm" placeholder="Ej: Dragon articulado v2" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Modelo de biblioteca</Label>
        <select
          name="model_id"
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
        >
          <option value="">— Externo (sin vincular)</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">URL fuente</Label>
        <Input name="source_url" type="url" className="h-8 text-sm" placeholder="https://..." />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Input name="notes" className="h-8 text-sm" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Agregar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function OptionRow({
  option,
  orderId,
  modelName,
}: {
  option: OrderModelOption;
  orderId: string;
  modelName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleSelect() {
    startTransition(async () => {
      await selectModelOption(option.id, orderId);
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeModelOption(option.id);
      router.refresh();
    });
  }

  function handleSaveToLibrary() {
    setSaveError(null);
    startTransition(async () => {
      const result = await saveOptionToLibrary(option.id, orderId);
      if (result?.error) setSaveError(result.error);
      else router.refresh();
    });
  }

  return (
    <div
      className={`flex items-start justify-between rounded-md border px-4 py-2 text-sm transition-colors ${
        option.is_selected ? "border-emerald-400 bg-emerald-50" : ""
      }`}
    >
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          {option.is_selected && (
            <span className="text-emerald-600 text-xs font-medium">✓ Seleccionado</span>
          )}
          <span className="font-medium truncate">{option.title}</span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          {modelName && (
            <Link href={`/models/${option.model_id}`} className="hover:underline">
              📚 {modelName}
            </Link>
          )}
          {option.source_url && (
            <a href={option.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              🔗 Fuente
            </a>
          )}
          {option.notes && <span>{option.notes}</span>}
        </div>
        {saveError && <p className="text-xs text-destructive mt-1">{saveError}</p>}
      </div>
      <div className="flex gap-1 ml-2 shrink-0">
        {!option.is_selected && (
          <Button variant="ghost" size="sm" disabled={isPending} onClick={handleSelect}>
            Seleccionar
          </Button>
        )}
        {!option.model_id && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleSaveToLibrary}
            title="Guardar en biblioteca de modelos"
          >
            📚 Guardar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleRemove}
          className="text-destructive hover:text-destructive"
        >
          Quitar
        </Button>
      </div>
    </div>
  );
}

export function ModelOptionsSection({
  orderId,
  options,
  models,
}: {
  orderId: string;
  options: OrderModelOption[];
  models: Model[];
}) {
  const [adding, setAdding] = useState(false);

  const modelMap = new Map(models.map((m) => [m.id, m.name]));
  const selected = options.filter((o) => o.is_selected);
  const unselected = options.filter((o) => !o.is_selected);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">
        Opciones de modelo ({options.length})
      </h2>

      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((o) => (
            <OptionRow
              key={o.id}
              option={o}
              orderId={orderId}
              modelName={o.model_id ? modelMap.get(o.model_id) : undefined}
            />
          ))}
        </div>
      )}

      {unselected.length > 0 && (
        <div className="space-y-2">
          {unselected.map((o) => (
            <OptionRow
              key={o.id}
              option={o}
              orderId={orderId}
              modelName={o.model_id ? modelMap.get(o.model_id) : undefined}
            />
          ))}
        </div>
      )}

      {options.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">Sin opciones de modelo.</p>
      )}

      {adding ? (
        <AddOptionForm orderId={orderId} models={models} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          + Agregar opcion
        </Button>
      )}
    </section>
  );
}
