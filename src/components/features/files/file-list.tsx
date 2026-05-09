"use client";

import { useState } from "react";
import { type FileRecord, type FileEntityType } from "@/types/database";
import { FileReferenceForm } from "./file-reference-form";

const FILE_TYPE_ICONS: Record<string, string> = {
  stl: "📦",
  image: "🖼️",
  gcode: "⚙️",
  pdf: "📄",
  sliced: "🔪",
  reference: "🔗",
  other: "📎",
};

const FILE_TYPE_LABELS: Record<string, string> = {
  stl: "STL",
  image: "Imagen",
  gcode: "G-Code",
  pdf: "PDF",
  sliced: "Laminado",
  reference: "Referencia",
  other: "Otro",
};

export function FileList({
  initialFiles,
  entityType,
  entityId,
}: {
  initialFiles: FileRecord[];
  entityType: FileEntityType;
  entityId: string;
}) {
  const [files, setFiles] = useState(initialFiles);

  return (
    <div className="space-y-3">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin archivos adjuntos. Pega un enlace de Google Drive.
        </p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>{FILE_TYPE_ICONS[f.file_type] ?? "📎"}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {FILE_TYPE_LABELS[f.file_type] ?? f.file_type}
                    {f.notes ? ` · ${f.notes}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none ml-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("es-UY")}
                </span>
                {f.gdrive_url && (
                  <a
                    href={f.gdrive_url}
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

      <FileReferenceForm
        entityType={entityType}
        entityId={entityId}
        onAdded={(f) => setFiles((prev) => [...prev, f])}
      />
    </div>
  );
}
