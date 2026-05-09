"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrintJob } from "@/lib/actions/print-jobs";
import { type PrintJob, type ModelVersion } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  running: "En proceso",
  completed: "Completado",
  failed: "Fallido",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

function CreateJobForm({
  orderId,
  orderQuantity,
  modelVersions,
  onDone,
}: {
  orderId: string;
  orderQuantity: number;
  modelVersions: (ModelVersion & { model_name: string })[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("order_id", orderId);
    setError(null);
    startTransition(async () => {
      const result = await createPrintJob(formData);
      if (result?.error) setError(result.error);
      else {
        router.refresh();
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-4 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Cantidad planificada *</Label>
          <Input
            name="quantity_planned"
            type="number"
            min="1"
            defaultValue={orderQuantity}
            required
            autoFocus
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Version de modelo</Label>
          <select
            name="model_version_id"
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            <option value="">— Sin version</option>
            {modelVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.model_name} v{v.version_number}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Input name="notes" className="h-8 text-sm" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Creando..." : "Crear trabajo"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function PrintJobsSection({
  orderId,
  orderQuantity,
  jobs,
  modelVersions,
}: {
  orderId: string;
  orderQuantity: number;
  jobs: PrintJob[];
  modelVersions: (ModelVersion & { model_name: string })[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">
        Trabajos de impresion ({jobs.length})
      </h2>

      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-md border px-4 py-2 text-sm"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[job.status] ?? "bg-muted"
                    }`}
                  >
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {job.quantity_completed}/{job.quantity_planned} completadas
                    {job.quantity_failed > 0 && `, ${job.quantity_failed} fallidas`}
                  </span>
                </div>
                {job.notes && <p className="text-xs text-muted-foreground">{job.notes}</p>}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/print-jobs/${job.id}`}>Ver trabajo</Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {jobs.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">Sin trabajos de impresion.</p>
      )}

      {adding ? (
        <CreateJobForm
          orderId={orderId}
          orderQuantity={orderQuantity}
          modelVersions={modelVersions}
          onDone={() => setAdding(false)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          + Crear trabajo de impresion
        </Button>
      )}
    </section>
  );
}
