"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrintProfile, toggleProfileActive } from "@/lib/actions/print-profiles";
import { type PrintProfile, type Printer, type Material } from "@/types/database";

function FdmFields() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1"><Label className="text-xs">Altura capa (mm)</Label>
          <Input name="layer_height_mm" type="number" step="0.01" className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Temp. boquilla (°C)</Label>
          <Input name="nozzle_temp" type="number" className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Temp. cama (°C)</Label>
          <Input name="bed_temp" type="number" className="h-8 text-sm" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1"><Label className="text-xs">Vel. impresion (mm/s)</Label>
          <Input name="print_speed_mm_s" type="number" className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Paredes</Label>
          <Input name="wall_count" type="number" className="h-8 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Relleno (%)</Label>
          <Input name="infill_pct" type="number" min="0" max="100" className="h-8 text-sm" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-xs">Soportes</Label>
          <select name="supports" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm">
            <option value="">—</option><option value="true">Sí</option><option value="false">No</option>
          </select></div>
        <div className="space-y-1"><Label className="text-xs">Adhesion</Label>
          <select name="brim_raft_skirt" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm">
            <option value="">—</option><option value="none">Ninguna</option>
            <option value="brim">Brim</option><option value="raft">Raft</option><option value="skirt">Skirt</option>
          </select></div>
      </div>
    </>
  );
}

function ResinFields() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1"><Label className="text-xs">Altura capa resina (mm)</Label>
        <Input name="resin_layer_height_mm" type="number" step="0.01" className="h-8 text-sm" /></div>
      <div className="space-y-1"><Label className="text-xs">Tiempo exposicion (s)</Label>
        <Input name="exposure_time_s" type="number" step="0.1" className="h-8 text-sm" /></div>
      <div className="space-y-1"><Label className="text-xs">Exp. capas base (s)</Label>
        <Input name="bottom_exposure_time_s" type="number" step="0.1" className="h-8 text-sm" /></div>
      <div className="space-y-1"><Label className="text-xs">Vel. elevacion (mm/s)</Label>
        <Input name="lift_speed_mm_s" type="number" step="0.1" className="h-8 text-sm" /></div>
      <div className="col-span-2 space-y-1"><Label className="text-xs">Notas soportes</Label>
        <Input name="supports_notes" className="h-8 text-sm" /></div>
    </div>
  );
}

export function PrintProfileCrud({
  profiles,
  printers,
  materials,
}: {
  profiles: PrintProfile[];
  printers: Printer[];
  materials: Material[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [selectedPrinterType, setSelectedPrinterType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = profiles.filter((p) => p.is_active);
  const inactive = profiles.filter((p) => !p.is_active);

  function handlePrinterChange(printerId: string) {
    const printer = printers.find((p) => p.id === printerId);
    setSelectedPrinterType(printer?.type ?? null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPrintProfile(formData);
      if (result?.error) setError(result.error);
      else { router.refresh(); setAdding(false); }
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleProfileActive(id, isActive);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {active.map((p) => {
          const printer = printers.find((pr) => pr.id === p.printer_id);
          const material = materials.find((m) => m.id === p.material_id);
          return (
            <div key={p.id} className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
              <div>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {printer?.type ?? "—"}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {printer?.name} · {material?.name}
                </span>
              </div>
              <Button variant="ghost" size="sm" disabled={isPending} onClick={() => toggleActive(p.id, false)}>
                Desactivar
              </Button>
            </div>
          );
        })}
        {active.length === 0 && <p className="text-sm text-muted-foreground">Sin perfiles activos.</p>}
      </div>

      {adding ? (
        <form action={handleSubmit} className="space-y-3 rounded-lg border p-4 max-w-lg">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre *</Label>
              <Input name="name" required autoFocus className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Impresora *</Label>
              <select name="printer_id" required
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                onChange={(e) => handlePrinterChange(e.target.value)}>
                <option value="">Seleccionar...</option>
                {printers.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Material *</Label>
            <select name="material_id" required
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm">
              <option value="">Seleccionar...</option>
              {materials.filter((m) => m.is_active).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
              ))}
            </select>
          </div>

          {selectedPrinterType === "FDM" && <FdmFields />}
          {selectedPrinterType === "resin" && <ResinFields />}

          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Input name="notes" className="h-8 text-sm" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>+ Agregar perfil</Button>
      )}

      {inactive.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">Inactivos ({inactive.length})</summary>
          <div className="mt-2 space-y-2">
            {inactive.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border px-4 py-2 text-sm opacity-60">
                <span className="font-medium">{p.name}</span>
                <Button variant="ghost" size="sm" disabled={isPending} onClick={() => toggleActive(p.id, true)}>Activar</Button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
