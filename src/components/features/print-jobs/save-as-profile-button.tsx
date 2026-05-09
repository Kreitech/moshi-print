"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAttemptAsProfile } from "@/lib/actions/save-attempt-as-profile";

export function SaveAsProfileButton({
  attemptId,
  savedProfileId,
  savedProfileName,
}: {
  attemptId: string;
  savedProfileId: string | null;
  savedProfileName?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (savedProfileId) {
    return (
      <Link
        href="/settings/profiles"
        className="text-xs text-emerald-700 hover:underline font-medium"
      >
        ✓ Perfil guardado: {savedProfileName ?? "ver"}
      </Link>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setOpen(true)}>
        Guardar como perfil
      </Button>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveAttemptAsProfile(attemptId, formData);
      if (result?.error) setError(result.error);
      else {
        router.refresh();
        setOpen(false);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2 mt-1">
      <Input
        name="name"
        autoFocus
        required
        placeholder="Nombre del perfil..."
        className="h-7 text-xs max-w-48"
      />
      <Button type="submit" size="sm" className="h-7 text-xs" disabled={isPending}>
        {isPending ? "..." : "Guardar"}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
