import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { EditAttemptForm } from "@/components/features/print-jobs/edit-attempt-form";

export default async function EditAttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id: jobId, attemptId } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: attempt } = await supabase
    .from("print_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("tenant_id", tenant!.id)
    .maybeSingle();

  if (!attempt) notFound();

  const [printerRes, materialRes, profileRes] = await Promise.all([
    supabase.from("printers").select("name").eq("id", attempt.printer_id).maybeSingle(),
    supabase.from("materials").select("name").eq("id", attempt.material_id).maybeSingle(),
    attempt.print_profile_id
      ? supabase.from("print_profiles").select("name").eq("id", attempt.print_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="p-6 space-y-4 max-w-lg">
      <div>
        <Link href={`/print-jobs/${jobId}`} className="text-sm text-muted-foreground hover:underline">
          ← Trabajo de impresion
        </Link>
        <h1 className="text-2xl font-bold mt-1">Editar intento</h1>
      </div>
      <EditAttemptForm
        attemptId={attemptId}
        jobId={jobId}
        defaultResult={attempt.result ?? null}
        defaultDurationMin={attempt.duration_min ?? null}
        defaultFailureReason={attempt.failure_reason ?? null}
        defaultNotes={attempt.notes ?? null}
        printerName={printerRes.data?.name ?? "—"}
        materialName={materialRes.data?.name ?? "—"}
        profileName={profileRes.data?.name ?? null}
      />
    </div>
  );
}
