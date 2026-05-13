import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { SettingsNav } from "@/components/features/settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-destructive">No autenticado.</p>
      </div>
    );
  }

  const tenant = await getActiveTenant(supabase);
  if (!tenant) {
    return (
      <div className="p-6">
        <p className="text-destructive">Sin espacio de trabajo.</p>
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-bold">Acceso denegado</h1>
        <p className="text-muted-foreground">
          Solo los propietarios y administradores pueden acceder a la
          configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <SettingsNav />
      </div>
      {children}
    </div>
  );
}
