import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { AddVersionForm } from "@/components/features/models/add-version-form";
import { FileList } from "@/components/features/files/file-list";
import { type ModelStatus } from "@/types/database";

const STATUS_LABELS: Record<ModelStatus, string> = {
  idea: "Idea",
  researching: "Investigando",
  ready_to_test: "Listo para probar",
  tested_ok: "Probado OK",
  needs_adjustments: "Necesita ajustes",
  production_ready: "Listo produccion",
  discarded: "Descartado",
};

const STATUS_COLORS: Record<ModelStatus, string> = {
  idea: "bg-slate-100 text-slate-700",
  researching: "bg-blue-100 text-blue-700",
  ready_to_test: "bg-yellow-100 text-yellow-700",
  tested_ok: "bg-green-100 text-green-700",
  needs_adjustments: "bg-orange-100 text-orange-700",
  production_ready: "bg-emerald-100 text-emerald-700",
  discarded: "bg-red-100 text-red-700",
};

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const [modelRes, versionsRes, filesRes, storageRes] = await Promise.all([
    supabase
      .from("models")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenant!.id)
      .maybeSingle(),
    supabase
      .from("model_versions")
      .select("*")
      .eq("model_id", id)
      .order("version_number", { ascending: false }),
    supabase
      .from("files")
      .select("*")
      .eq("entity_type", "model")
      .eq("entity_id", id)
      .order("created_at"),
    supabase
      .from("tenant_storage_connections")
      .select("id")
      .eq("tenant_id", tenant!.id)
      .eq("provider", "google_drive")
      .maybeSingle(),
  ]);

  if (!modelRes.data) notFound();

  const model = modelRes.data;
  const versions = versionsRes.data ?? [];
  const files = filesRes.data ?? [];
  const status = model.status as ModelStatus;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/models" className="text-sm text-muted-foreground hover:underline">
              ← Modelos
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{model.name}</h1>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/models/${id}/edit`}>Editar</Link>
        </Button>
      </div>

      {model.description && (
        <p className="text-sm text-muted-foreground">{model.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        {model.source_url && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Fuente</p>
            <a
              href={model.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate block"
            >
              {model.source_platform ?? model.source_url}
            </a>
          </div>
        )}
        {model.license && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Licencia</p>
            <p>{model.license}</p>
          </div>
        )}
        {model.commercial_use_allowed !== null && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Uso comercial</p>
            <p>{model.commercial_use_allowed ? "Permitido" : "No permitido"}</p>
          </div>
        )}
        {model.attribution_required !== null && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Atribucion requerida</p>
            <p>{model.attribution_required ? "Si" : "No"}</p>
          </div>
        )}
      </div>

      {model.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {model.tags.map((tag: string) => (
            <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {model.notes && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
          <p className="text-sm whitespace-pre-wrap">{model.notes}</p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Versiones ({versions.length})
          </h2>
        </div>
        <AddVersionForm modelId={id} />
        {versions.length > 0 ? (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-md border px-4 py-2 text-sm"
              >
                <span className="font-medium shrink-0">v{v.version_number}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(v.created_at).toLocaleDateString("es-UY")}
                </span>
                {v.notes && <span className="text-xs">{v.notes}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin versiones registradas.</p>
        )}
      </section>

      <section>
        <FileList
          initialFiles={files}
          entityType="model"
          entityId={id}
          hasStorage={!!storageRes.data}
        />
      </section>
    </div>
  );
}
