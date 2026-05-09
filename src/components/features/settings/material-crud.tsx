"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMaterial, updateMaterial, toggleMaterialActive } from "@/lib/actions/materials";
import { type Material } from "@/types/database";

const TYPE_LABELS: Record<string, string> = {
  PLA: "PLA", ABS: "ABS", PETG: "PETG", resin: "Resina", other: "Otro",
};

function MaterialForm({ initial, onDone }: { initial?: Material; onDone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = initial
        ? await updateMaterial(initial.id, formData)
        : await createMaterial(formData);
      if (result?.error) setError(result.error);
      else { router.refresh(); onDone(); }
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
          <select id="type" name="type" defaultValue={initial?.type ?? "PLA"}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm">
            <option value="PLA">PLA</option>
            <option value="ABS">ABS</option>
            <option value="PETG">PETG</option>
            <option value="resin">Resina</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="brand" className="text-xs">Marca</Label>
          <Input id="brand" name="brand" defaultValue={initial?.brand ?? ""} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="color" className="text-xs">Color (hex)</Label>
          <Input id="color" name="color" placeholder="#FFFFFF" defaultValue={initial?.color ?? ""} className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs">Notas</Label>
        <Input id="notes" name="notes" defaultValue={initial?.notes ?? ""} className="h-8 text-sm" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

function MaterialRow({ material }: { material: Material }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await toggleMaterialActive(material.id, !material.is_active);
      router.refresh();
    });
  }

  if (editing) return <MaterialForm initial={material} onDone={() => setEditing(false)} />;

  return (
    <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        {material.color && (
          <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: material.color }} />
        )}
        <span className="font-medium">{material.name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{TYPE_LABELS[material.type] ?? material.type}</span>
        {material.brand && <span className="text-muted-foreground text-xs">{material.brand}</span>}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Editar</Button>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={toggle}>
          {material.is_active ? "Desactivar" : "Activar"}
        </Button>
      </div>
    </div>
  );
}

export function MaterialCrud({ materials }: { materials: Material[] }) {
  const [adding, setAdding] = useState(false);
  const active = materials.filter((m) => m.is_active);
  const inactive = materials.filter((m) => !m.is_active);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {active.map((m) => <MaterialRow key={m.id} material={m} />)}
        {active.length === 0 && <p className="text-sm text-muted-foreground">Sin materiales activos.</p>}
      </div>
      {adding
        ? <MaterialForm onDone={() => setAdding(false)} />
        : <Button variant="outline" size="sm" onClick={() => setAdding(true)}>+ Agregar material</Button>}
      {inactive.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">Inactivos ({inactive.length})</summary>
          <div className="mt-2 space-y-2">{inactive.map((m) => <MaterialRow key={m.id} material={m} />)}</div>
        </details>
      )}
    </div>
  );
}
