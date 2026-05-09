"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transitionPrintJobStatus } from "@/lib/actions/print-jobs";

function CompleteForm({
  jobId,
  quantityPlanned,
  onDone,
}: {
  jobId: string;
  quantityPlanned: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const completed = parseInt(fd.get("quantity_completed") as string, 10);
    const failed = parseInt(fd.get("quantity_failed") as string, 10);
    setError(null);
    startTransition(async () => {
      const result = await transitionPrintJobStatus(jobId, "completed", {
        quantity_completed: completed,
        quantity_failed: failed,
      });
      if (result?.error) setError(result.error);
      else { router.refresh(); onDone(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4 max-w-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Completadas</Label>
          <Input name="quantity_completed" type="number" min="0" defaultValue={quantityPlanned} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fallidas</Label>
          <Input name="quantity_failed" type="number" min="0" defaultValue={0} className="h-8 text-sm" />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? "..." : "Confirmar"}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

export function JobStatusActions({
  jobId,
  status,
  quantityPlanned,
}: {
  jobId: string;
  status: string;
  quantityPlanned: number;
}) {
  const router = useRouter();
  const [showComplete, setShowComplete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function transition(newStatus: "running" | "failed") {
    startTransition(async () => {
      await transitionPrintJobStatus(jobId, newStatus);
      router.refresh();
    });
  }

  if (status === "completed" || status === "failed") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <Button size="sm" disabled={isPending} onClick={() => transition("running")}>
          Iniciar impresion
        </Button>
      )}
      {status === "running" && !showComplete && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => setShowComplete(true)}>
            Completar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => transition("failed")}
          >
            Marcar como fallido
          </Button>
        </>
      )}
      {status === "running" && showComplete && (
        <CompleteForm
          jobId={jobId}
          quantityPlanned={quantityPlanned}
          onDone={() => setShowComplete(false)}
        />
      )}
    </div>
  );
}
