import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { InviteForm } from "@/components/features/settings/invite-form";
import { TeamMemberRow } from "@/components/features/settings/team-member-row";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import type { TenantRole } from "@/types/database";

export default async function TeamPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenant = await getActiveTenant(supabase);

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant!.id)
    .eq("user_id", user!.id)
    .maybeSingle();

  const currentUserRole = membership!.role as TenantRole;

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: members } = await svc
    .from("tenant_members")
    .select("id, user_id, role, created_at")
    .eq("tenant_id", tenant!.id)
    .order("created_at");

  const { data: usersData } = await svc.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(usersData.users.map((u) => [u.id, u.email ?? ""]));

  const teamMembers = (members ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as TenantRole,
    email: emailMap.get(m.user_id) ?? "(desconocido)",
    created_at: m.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Equipo</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona los miembros de tu espacio de trabajo.
        </p>
      </div>

      <InviteForm currentUserRole={currentUserRole} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="w-44" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              currentUserId={user!.id}
              currentUserRole={currentUserRole}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
