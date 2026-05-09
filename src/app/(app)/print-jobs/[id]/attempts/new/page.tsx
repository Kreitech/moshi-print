import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { LogAttemptForm } from "@/components/features/print-jobs/log-attempt-form";

export default async function NewAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: job } = await supabase
    .from("print_jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("tenant_id", tenant!.id)
    .maybeSingle();

  if (!job) notFound();

  const [printersRes, materialsRes, profilesRes] = await Promise.all([
    supabase.from("printers").select("id, name, type").eq("tenant_id", tenant!.id).eq("is_active", true).order("name"),
    supabase.from("materials").select("id, name, type").eq("tenant_id", tenant!.id).eq("is_active", true).order("name"),
    supabase.from("print_profiles").select("id, name").eq("tenant_id", tenant!.id).eq("is_active", true).order("name"),
  ]);

  return (
    <div className="p-6 space-y-4 max-w-lg">
      <div>
        <Link href={`/print-jobs/${jobId}`} className="text-sm text-muted-foreground hover:underline">
          ← Trabajo de impresion
        </Link>
        <h1 className="text-2xl font-bold mt-1">Registrar intento</h1>
      </div>
      <LogAttemptForm
        jobId={jobId}
        printers={printersRes.data ?? []}
        materials={materialsRes.data ?? []}
        profiles={profilesRes.data ?? []}
      />
    </div>
  );
}
