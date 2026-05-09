import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { JobStatusActions } from "@/components/features/print-jobs/job-status-actions";
import { SaveAsProfileButton } from "@/components/features/print-jobs/save-as-profile-button";
import { FileList } from "@/components/features/files/file-list";
import { type PrintAttempt } from "@/types/database";

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  running: "En proceso",
  completed: "Completado",
  failed: "Fallido",
};

const JOB_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const RESULT_COLORS: Record<string, string> = {
  success: "border-green-300 bg-green-50",
  failure: "border-red-300 bg-red-50",
  partial: "border-yellow-300 bg-yellow-50",
};

const RESULT_LABELS: Record<string, string> = {
  success: "Exitoso",
  failure: "Fallido",
  partial: "Parcial",
};

export default async function PrintJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: job } = await supabase
    .from("print_jobs")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant!.id)
    .maybeSingle();

  if (!job) notFound();

  const [orderRes, attemptsRes, versionRes, printersRes, materialsRes, profilesRes] =
    await Promise.all([
      supabase.from("orders").select("id, title").eq("id", job.order_id).maybeSingle(),
      supabase
        .from("print_attempts")
        .select("*")
        .eq("print_job_id", id)
        .order("created_at", { ascending: false }),
      job.model_version_id
        ? supabase
            .from("model_versions")
            .select("version_number, model_id")
            .eq("id", job.model_version_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("printers").select("id, name").eq("tenant_id", tenant!.id),
      supabase.from("materials").select("id, name").eq("tenant_id", tenant!.id),
      supabase.from("print_profiles").select("id, name").eq("tenant_id", tenant!.id),
    ]);

  const printerMap = new Map((printersRes.data ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
  const materialMap = new Map((materialsRes.data ?? []).map((m: { id: string; name: string }) => [m.id, m.name]));
  const profileMap = new Map((profilesRes.data ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
  const attempts = (attemptsRes.data ?? []) as PrintAttempt[];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="space-y-1">
        {orderRes.data && (
          <Link
            href={`/orders/${orderRes.data.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {orderRes.data.title}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Trabajo de impresion</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              JOB_STATUS_COLORS[job.status] ?? "bg-muted"
            }`}
          >
            {JOB_STATUS_LABELS[job.status] ?? job.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Planificadas</p>
          <p className="text-xl font-bold">{job.quantity_planned}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Completadas</p>
          <p className="text-xl font-bold text-green-600">{job.quantity_completed}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fallidas</p>
          <p className="text-xl font-bold text-red-600">{job.quantity_failed}</p>
        </div>
      </div>

      {versionRes.data && (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground mb-1">Version de modelo</p>
          <Link
            href={`/models/${versionRes.data.model_id}`}
            className="hover:underline"
          >
            Modelo v{versionRes.data.version_number}
          </Link>
        </div>
      )}

      {job.notes && (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground mb-1">Notas</p>
          <p>{job.notes}</p>
        </div>
      )}

      <JobStatusActions
        jobId={job.id}
        status={job.status}
        quantityPlanned={job.quantity_planned}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Intentos ({attempts.length})
          </h2>
          <Link
            href={`/print-jobs/${id}/attempts/new`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            + Registrar intento
          </Link>
        </div>

        {attempts.length > 0 ? (
          <div className="space-y-4">
            {attempts.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border-2 p-4 space-y-2 text-sm ${
                  RESULT_COLORS[a.result] ?? "bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {RESULT_LABELS[a.result] ?? a.result}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("es-UY")}
                    </span>
                  </div>
                  {a.duration_min && (
                    <span className="text-xs text-muted-foreground">
                      {a.duration_min} min
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>🖨 {printerMap.get(a.printer_id) ?? "—"}</span>
                  <span>🧵 {materialMap.get(a.material_id) ?? "—"}</span>
                  {a.print_profile_id && (
                    <span>⚙️ {profileMap.get(a.print_profile_id) ?? "—"}</span>
                  )}
                </div>
                {a.failure_reason && (
                  <p className="text-xs text-red-700">Razon: {a.failure_reason}</p>
                )}
                {a.notes && <p className="text-xs">{a.notes}</p>}
                {a.result === "success" && (
                  <SaveAsProfileButton
                    attemptId={a.id}
                    savedProfileId={a.saved_as_profile_id}
                    savedProfileName={a.saved_as_profile_id ? profileMap.get(a.saved_as_profile_id) : null}
                  />
                )}
                <FileList
                  initialFiles={[]}
                  entityType="print_attempt"
                  entityId={a.id}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin intentos registrados.</p>
        )}
      </section>
    </div>
  );
}
