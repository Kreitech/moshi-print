"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logPrintAttempt } from "@/lib/actions/print-attempts";

type Selectable = { id: string; name: string };

export function LogAttemptForm({
  jobId,
  printers,
  materials,
  profiles,
}: {
  jobId: string;
  printers: (Selectable & { type?: string })[];
  materials: (Selectable & { type?: string })[];
  profiles: Selectable[];
}) {
  const router = useRouter();
  const [result, setResult] = useState("success");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await logPrintAttempt(jobId, formData);
      if (res?.error) setError(res.error);
      else router.push(`/print-jobs/${jobId}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Impresora *</Label>
          <select
            name="printer_id"
            required
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="">Seleccionar...</option>
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.type ? ` (${p.type})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Material *</Label>
          <select
            name="material_id"
            required
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="">Seleccionar...</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.type ? ` (${m.type})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Perfil de impresion</Label>
        <select
          name="print_profile_id"
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
        >
          <option value="">— Sin perfil</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Resultado *</Label>
          <select
            name="result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="success">Exitoso</option>
            <option value="failure">Fallido</option>
            <option value="partial">Parcial</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duracion (min)</Label>
          <Input name="duration_min" type="number" min="1" className="h-8 text-sm" />
        </div>
      </div>

      {result === "failure" && (
        <div className="space-y-1">
          <Label className="text-xs">Razon de falla *</Label>
          <Input
            name="failure_reason"
            required
            className="h-8 text-sm"
            placeholder="Ej: adhesion, warping, corte de luz..."
          />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Input name="notes" className="h-8 text-sm" />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Registrar intento"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/print-jobs/${jobId}`)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
