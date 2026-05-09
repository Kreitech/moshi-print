import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { AppNav } from "@/components/features/app-nav";

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

  return (
    <div className="min-h-screen bg-background flex">
      <AppNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
