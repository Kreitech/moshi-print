"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePrintAttempt } from "@/lib/actions/print-attempts";

export function EditAttemptForm({
  attemptId,
  jobId,
  defaultResult,
  defaultDurationMin,
  defaultFailureReason,
  defaultNotes,
  printerName,
  materialName,
  profileName,
}: {
  attemptId: string;
  jobId: string;
  defaultResult: string | null;
  defaultDurationMin: number | null;
  defaultFailureReason: string | null;
  defaultNotes: string | null;
  printerName: string;
  materialName: string;
  profileName: string | null;
}) {
  const router = useRouter();
  const [result, setResult] = useState(defaultResult ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updatePrintAttempt(attemptId, formData);
      if (res?.error) setError(res.error);
      else router.push(`/print-jobs/${jobId}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Configuracion (solo lectura)</p>
        <p>🖨 {printerName}</p>
        <p>🧵 {materialName}</p>
        {profileName && <p>⚙️ {profileName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Resultado</Label>
          <select
            name="result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="">En progreso (borrador)</option>
            <option value="success">Exitoso</option>
            <option value="failure">Fallido</option>
            <option value="partial">Parcial</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duracion (min)</Label>
          <Input
            name="duration_min"
            type="number"
            min="1"
            defaultValue={defaultDurationMin ?? ""}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {result === "failure" && (
        <div className="space-y-1">
          <Label className="text-xs">Razon de falla *</Label>
          <Input
            name="failure_reason"
            required
            defaultValue={defaultFailureReason ?? ""}
            className="h-8 text-sm"
            placeholder="Ej: adhesion, warping, corte de luz..."
          />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Input name="notes" defaultValue={defaultNotes ?? ""} className="h-8 text-sm" />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
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
