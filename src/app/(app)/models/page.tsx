import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { type Model, type ModelStatus } from "@/types/database";

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

const ALL_STATUSES: ModelStatus[] = [
  "idea",
  "researching",
  "ready_to_test",
  "tested_ok",
  "needs_adjustments",
  "production_ready",
  "discarded",
];

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  let query = supabase
    .from("models")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .order("name");

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  const { data: models } = await query;

  const activeStatuses = ALL_STATUSES.filter((s) => s !== "discarded");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Biblioteca de modelos</h1>
        <Button asChild size="sm">
          <Link href="/models/new">+ Nuevo modelo</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Link
          href="/models"
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            !params.status ? "bg-foreground text-background" : "hover:bg-muted"
          }`}
        >
          Todos
        </Link>
        {activeStatuses.map((s) => (
          <Link
            key={s}
            href={`/models?status=${s}${params.q ? `&q=${params.q}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              params.status === s ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
        <Link
          href={`/models?status=discarded${params.q ? `&q=${params.q}` : ""}`}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            params.status === "discarded" ? "bg-foreground text-background" : "hover:bg-muted"
          }`}
        >
          Descartados
        </Link>
      </div>

      <form method="GET" action="/models" className="max-w-sm">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Buscar por nombre..."
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm placeholder:text-muted-foreground"
        />
        {params.status && <input type="hidden" name="status" value={params.status} />}
      </form>

      {models && models.length > 0 ? (
        <div className="space-y-2">
          {models.map((model: Model) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-0.5">
                <p className="font-medium">{model.name}</p>
                {model.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{model.description}</p>
                )}
                {model.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {model.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span
                className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[model.status as ModelStatus] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {STATUS_LABELS[model.status as ModelStatus] ?? model.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {params.status || params.q
              ? "No hay modelos con ese filtro."
              : "La biblioteca esta vacia. Agrega tu primer modelo."}
          </p>
          {!params.status && !params.q && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/models/new">+ Nuevo modelo</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
