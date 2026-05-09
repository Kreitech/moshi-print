"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrinter, updatePrinter, togglePrinterActive } from "@/lib/actions/printers";
import { type Printer } from "@/types/database";

const TYPE_LABELS = { FDM: "FDM", resin: "Resina", other: "Otro" };

function PrinterForm({
  initial,
  onDone,
}: {
  initial?: Printer;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = initial
        ? await updatePrinter(initial.id, formData)
        : await createPrinter(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-4 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs">Nombre *</Label>
          <Input id="name" name="name" required defaultValue={initial?.name} className="h-8 text-sm" autoFocus />
        </div>
        <div className="space-y-1">
          <Label htmlFor="type" className="text-xs">Tipo</Label>
          <select id="type" name="type" defaultValue={initial?.type ?? "FDM"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm">
            <option value="FDM">FDM</option>
            <option value="resin">Resina</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="model_name" className="text-xs">Modelo</Label>
        <Input id="model_name" name="model_name" defaultValue={initial?.model_name ?? ""} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs">Notas</Label>
        <Input id="notes" name="notes" defaultValue={initial?.notes ?? ""} className="h-8 text-sm" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

function PrinterRow({ printer }: { printer: Printer }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await togglePrinterActive(printer.id, !printer.is_active);
      router.refresh();
    });
  }

  if (editing) {
    return <PrinterForm initial={printer} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
      <div>
        <span className="font-medium">{printer.name}</span>
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
          {TYPE_LABELS[printer.type] ?? printer.type}
        </span>
        {printer.model_name && (
          <span className="ml-2 text-muted-foreground text-xs">{printer.model_name}</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Editar</Button>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={toggle}>
          {printer.is_active ? "Desactivar" : "Activar"}
        </Button>
      </div>
    </div>
  );
}

export function PrinterCrud({ printers }: { printers: Printer[] }) {
  const [adding, setAdding] = useState(false);
  const active = printers.filter((p) => p.is_active);
  const inactive = printers.filter((p) => !p.is_active);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {active.map((p) => <PrinterRow key={p.id} printer={p} />)}
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin impresoras activas.</p>
        )}
      </div>

      {adding ? (
        <PrinterForm onDone={() => setAdding(false)} />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          + Agregar impresora
        </Button>
      )}

      {inactive.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Inactivas ({inactive.length})
          </summary>
          <div className="mt-2 space-y-2">
            {inactive.map((p) => <PrinterRow key={p.id} printer={p} />)}
          </div>
        </details>
      )}
    </div>
  );
}
