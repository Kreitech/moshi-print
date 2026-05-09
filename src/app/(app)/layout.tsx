import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const tenant = await getActiveTenant(supabase);
  if (!tenant) redirect("/onboarding");

  return <div className="min-h-screen bg-background">{children}</div>;
}
