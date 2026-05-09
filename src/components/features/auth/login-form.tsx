"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { signInWithPassword, signInWithMagicLink } from "@/lib/actions/auth";

type Mode = "password" | "magic-link";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const action =
        mode === "password" ? signInWithPassword : signInWithMagicLink;
      const result = await action(formData);

      if (result?.error) setError(result.error);
      if (result && "success" in result && result.success)
        setSuccess(result.success);
    });
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="hola@moshicrea.com"
              required
              autoComplete="email"
            />
          </div>

          {mode === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          {success && (
            <p className="text-sm font-medium text-green-600">{success}</p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Cargando..."
              : mode === "password"
                ? "Iniciar sesión"
                : "Enviar enlace mágico"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setMode(mode === "password" ? "magic-link" : "password");
              setError(null);
              setSuccess(null);
            }}
          >
            {mode === "password"
              ? "Prefiero recibir un enlace por correo"
              : "Volver a iniciar sesión con contraseña"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
