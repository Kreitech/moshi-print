"use client";

import { useState, useTransition } from "react";
import { updateMemberRole, removeMember } from "@/lib/actions/team";
import { TableRow, TableCell } from "@/components/ui/table";
import type { TeamMember } from "@/lib/actions/team";
import type { TenantRole } from "@/types/database";

const ROLE_LABELS: Record<TenantRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  operator: "Operador",
  sales: "Ventas",
};

const OWNER_ROLES: TenantRole[] = ["owner", "admin", "operator", "sales"];
const ADMIN_ROLES: TenantRole[] = ["operator", "sales"];

interface Props {
  member: TeamMember;
  currentUserId: string;
  currentUserRole: TenantRole;
}

export function TeamMemberRow({ member, currentUserId, currentUserRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<TenantRole>(member.role);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = member.user_id === currentUserId;
  const canEdit =
    !isSelf &&
    !(currentUserRole === "admin" && ["owner", "admin"].includes(member.role));

  const availableRoles =
    currentUserRole === "owner" ? OWNER_ROLES : ADMIN_ROLES;

  const isDirty = selectedRole !== member.role;

  function handleSaveRole() {
    setError(null);
    const fd = new FormData();
    fd.append("member_id", member.id);
    fd.append("role", selectedRole);
    startTransition(async () => {
      const result = await updateMemberRole(fd);
      if (result?.error) setError(result.error);
    });
  }

  function handleRemove() {
    if (!confirm(`¿Eliminar a ${member.email} del equipo?`)) return;
    setError(null);
    const fd = new FormData();
    fd.append("member_id", member.id);
    startTransition(async () => {
      const result = await removeMember(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs sm:text-sm">{member.email}</TableCell>
      <TableCell>
        {canEdit ? (
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value as TenantRole);
              setError(null);
            }}
            disabled={isPending}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm disabled:opacity-50"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm">{ROLE_LABELS[member.role]}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && isDirty && (
            <button
              onClick={handleSaveRole}
              disabled={isPending}
              className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Guardar
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-xs px-2 py-1 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              Eliminar
            </button>
          )}
          {isSelf && (
            <span className="text-xs text-muted-foreground">tú</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </TableCell>
    </TableRow>
  );
}
