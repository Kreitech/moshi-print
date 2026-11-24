"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correctPendingMemberEmail, sendMemberAccessEmail, type TeamMember } from "@/lib/actions/team";

export function MemberEmailActions({ member }: { member: TeamMember }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const emailId = `member-email-${member.id}`;

  function submit(action: typeof correctPendingMemberEmail | typeof sendMemberAccessEmail, data: FormData) {
    data.set("member_id", member.id);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action(data);
        if (result.error) {
          setMessage({ text: result.error, error: true });
        } else if (result.success) {
          setMessage({ text: result.success, error: false });
          setEditing(false);
        }
      } catch {
        setMessage({ text: "No se pudo completar la solicitud. Intentá de nuevo.", error: true });
      }
    });
  }

  function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(correctPendingMemberEmail, new FormData(event.currentTarget));
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => submit(sendMemberAccessEmail, new FormData())}>
          {member.pendingInvite ? "Reenviar invitación" : "Enviar recuperación"}
        </Button>
        {member.pendingInvite && member.role !== "owner" && (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setEditing(!editing)}>
            {editing ? "Cancelar" : "Corregir correo"}
          </Button>
        )}
      </div>
      {editing && (
        <form onSubmit={saveEmail} className="space-y-2">
          <Label htmlFor={emailId}>Nuevo correo</Label>
          <Input id={emailId} name="email" type="email" required disabled={pending} />
          <Button type="submit" size="sm" disabled={pending}>Guardar y enviar invitación</Button>
        </form>
      )}
      {message && <p role={message.error ? "alert" : "status"} className={message.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{message.text}</p>}
    </div>
  );
}
