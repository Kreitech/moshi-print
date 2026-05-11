"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { signInWithPassword, signInWithMagicLink, signUpWithPassword } from "@/lib/actions/auth";

type Mode = "password" | "signup" | "magic-link";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const action =
        mode === "password"
          ? signInWithPassword
          : mode === "signup"
            ? signUpWithPassword
            : signInWithMagicLink;
      const result = await action(formData);

      if (result?.error) { setError(result.error); return; }
      if (result && "redirect" in result && result.redirect) {
        router.push(result.redirect);
        return;
      }
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

          {(mode === "password" || mode === "signup") && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
                : mode === "signup"
                  ? "Crear cuenta"
                  : "Enviar enlace mágico"}
          </Button>

          {mode === "password" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
            >
              ¿No tienes cuenta? Regístrate
            </Button>
          )}

          {mode === "signup" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => { setMode("password"); setError(null); setSuccess(null); }}
            >
              Ya tengo cuenta — Iniciar sesión
            </Button>
          )}

          {(mode === "password" || mode === "signup") && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => { setMode("magic-link"); setError(null); setSuccess(null); }}
            >
              Prefiero recibir un enlace por correo
            </Button>
          )}

          {mode === "magic-link" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => { setMode("password"); setError(null); setSuccess(null); }}
            >
              Volver a iniciar sesión con contraseña
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
