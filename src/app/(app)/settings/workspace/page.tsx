import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { WorkspaceForm } from "@/components/features/settings/workspace-form";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Espacio de trabajo</h2>
        <p className="text-sm text-muted-foreground">
          Información general de tu espacio de trabajo.
        </p>
      </div>

      <WorkspaceForm initialName={tenant!.name} slug={tenant!.slug} />
    </div>
  );
}
