import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { error } = await supabase
    .from("tenant_storage_connections")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("provider", "google_drive");

  if (error) return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });

  return NextResponse.json({ success: true });
}
