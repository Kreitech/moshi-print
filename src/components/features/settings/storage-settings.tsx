"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { type TenantStorageConnection } from "@/types/database";

export function StorageSettings({
  connection,
}: {
  connection: TenantStorageConnection | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/google-drive/disconnect", { method: "POST" });
      if (res.ok) {
        setDisconnected(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al desconectar.");
      }
    });
  }

  const isConnected = connection && !disconnected;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-1">Google Drive</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Conecta Google Drive para subir archivos STL, imágenes y G-Code directamente desde la app.
          Los archivos se guardan en una carpeta dedicada de tu workspace.
        </p>

        {isConnected ? (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Conectado</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Carpeta:{" "}
                <a
                  href={connection.drive_folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Abrir en Drive
                </a>
              </p>
              <p>
                Conectado:{" "}
                {new Date(connection.connected_at).toLocaleDateString("es-UY", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDisconnect}
            >
              {isPending ? "Desconectando..." : "Desconectar Drive"}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sin conexión activa. Conecta tu cuenta de Google para habilitar la subida de archivos.
            </p>
            <a href="/api/auth/google-drive">
              <Button size="sm" variant="outline">
                Conectar Google Drive
              </Button>
            </a>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
