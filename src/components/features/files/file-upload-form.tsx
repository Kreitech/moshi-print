"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type FileEntityType, type FileRecord } from "@/types/database";

const CATEGORY_OPTIONS = [
  { value: "stl", label: "STL" },
  { value: "image", label: "Imagen" },
  { value: "gcode", label: "G-Code" },
  { value: "pdf", label: "PDF" },
  { value: "sliced", label: "Archivo laminado" },
  { value: "reference", label: "Referencia" },
  { value: "other", label: "Otro" },
];

export function FileUploadForm({
  entityType,
  entityId,
  onUploaded,
}: {
  entityType: FileEntityType;
  entityId: string;
  onUploaded: (file: FileRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = fileRef.current;
    if (!fileInput?.files?.[0]) {
      setError("Selecciona un archivo.");
      return;
    }

    const formData = new FormData();
    formData.set("file", fileInput.files[0]);
    formData.set("entity_type", entityType);
    formData.set("entity_id", entityId);
    formData.set("file_category", (form.elements.namedItem("file_category") as HTMLSelectElement).value);

    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Error al subir el archivo.");
      } else {
        setOpen(false);
        form.reset();
        onUploaded(data.file as FileRecord);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Subir archivo
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label htmlFor="file" className="text-xs">
            Archivo *
          </Label>
          <input
            ref={fileRef}
            id="file"
            name="file"
            type="file"
            required
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="file_category" className="text-xs">
            Categoría
          </Label>
          <select
            id="file_category"
            name="file_category"
            defaultValue="other"
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Subiendo..." : "Subir a Drive"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
