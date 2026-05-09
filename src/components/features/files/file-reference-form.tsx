"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFileReference } from "@/lib/actions/files";
import { type FileEntityType, type FileRecord } from "@/types/database";

const FILE_TYPE_OPTIONS = [
  { value: "stl", label: "STL" },
  { value: "image", label: "Imagen" },
  { value: "gcode", label: "G-Code" },
  { value: "pdf", label: "PDF" },
  { value: "sliced", label: "Archivo laminado" },
  { value: "reference", label: "Referencia" },
  { value: "other", label: "Otro" },
];

export function FileReferenceForm({
  entityType,
  entityId,
  onAdded,
}: {
  entityType: FileEntityType;
  entityId: string;
  onAdded: (file: FileRecord) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addFileReference(entityType, entityId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        // Optimistic: caller refreshes or re-fetches
        onAdded({
          id: crypto.randomUUID(),
          tenant_id: "",
          entity_type: entityType,
          entity_id: entityId,
          name: (formData.get("name") as string).trim(),
          file_type: (formData.get("file_type") as FileRecord["file_type"]) ?? "other",
          gdrive_url: (formData.get("gdrive_url") as string)?.trim() || null,
          notes: (formData.get("notes") as string)?.trim() || null,
          uploaded_by: "",
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Agregar archivo
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs">
            Nombre *
          </Label>
          <Input id="name" name="name" required autoFocus className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="file_type" className="text-xs">
            Tipo
          </Label>
          <select
            id="file_type"
            name="file_type"
            defaultValue="other"
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            {FILE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="gdrive_url" className="text-xs">
          Enlace de Google Drive
        </Label>
        <Input
          id="gdrive_url"
          name="gdrive_url"
          type="url"
          placeholder="https://drive.google.com/..."
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs">
          Notas
        </Label>
        <Input id="notes" name="notes" className="h-8 text-sm" />
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
