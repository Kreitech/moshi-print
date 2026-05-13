"use client";

import { useState } from "react";
import { type FileRecord, type FileEntityType } from "@/types/database";
import { FileUploadForm } from "./file-upload-form";

const CATEGORY_ICONS: Record<string, string> = {
  stl: "📦",
  image: "🖼️",
  gcode: "⚙️",
  pdf: "📄",
  sliced: "🔪",
  reference: "🔗",
  other: "📎",
};

const CATEGORY_LABELS: Record<string, string> = {
  stl: "STL",
  image: "Imagen",
  gcode: "G-Code",
  pdf: "PDF",
  sliced: "Laminado",
  reference: "Referencia",
  other: "Otro",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({
  initialFiles,
  entityType,
  entityId,
  hasStorage,
}: {
  initialFiles: FileRecord[];
  entityType: FileEntityType;
  entityId: string;
  hasStorage: boolean;
}) {
  const [files, setFiles] = useState(initialFiles);

  return (
    <div className="space-y-3">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin archivos adjuntos.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>{CATEGORY_ICONS[f.file_category] ?? "📎"}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[f.file_category] ?? f.file_category}
                    {f.size_bytes ? ` · ${formatBytes(f.size_bytes)}` : ""}
                    {f.notes ? ` · ${f.notes}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none ml-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("es-UY")}
                </span>
                {f.web_view_link && (
                  <a
                    href={f.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Abrir en Drive
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasStorage ? (
        <FileUploadForm
          entityType={entityType}
          entityId={entityId}
          onUploaded={(f) => setFiles((prev) => [...prev, f])}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          <a href="/settings/storage" className="underline hover:text-foreground">
            Conecta Google Drive
          </a>{" "}
          para adjuntar archivos.
        </p>
      )}
    </div>
  );
}
