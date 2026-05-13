"use client";

import { useRef, useState, useTransition } from "react";
import { inviteTeamMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenantRole } from "@/types/database";

const ALL_ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "operator", label: "Operador" },
  { value: "sales", label: "Ventas" },
] as const;

export function InviteForm({ currentUserRole }: { currentUserRole: TenantRole }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roles =
    currentUserRole === "owner"
      ? ALL_ROLES
      : ALL_ROLES.filter((r) => r.value !== "admin");

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await inviteTeamMember(formData);
      if (result?.error) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        setSuccess(
          "invited" in result && result.invited
            ? "Invitación enviada por email."
            : "Miembro agregado al equipo."
        );
        formRef.current?.reset();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Invitar miembro</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={handleSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <Label htmlFor="invite-email" className="sr-only">
              Email
            </Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-role" className="sr-only">
              Rol
            </Label>
            <select
              id="invite-role"
              name="role"
              defaultValue="operator"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enviando..." : "Invitar"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            {success}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
