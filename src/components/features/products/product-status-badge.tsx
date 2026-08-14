import { cn } from "@/lib/utils";
import { type SellableProductStatus } from "@/types/database";

const STATUS_LABELS: Record<SellableProductStatus, string> = {
  draft: "Borrador",
  ready: "Listo",
  published: "Publicado",
  paused: "Pausado",
  archived: "Archivado",
};

const STATUS_STYLES: Record<SellableProductStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  ready: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  archived: "bg-neutral-100 text-neutral-500",
};

export function ProductStatusBadge({ status }: { status: string }) {
  const key = status as SellableProductStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {STATUS_LABELS[key] ?? status}
    </span>
  );
}
