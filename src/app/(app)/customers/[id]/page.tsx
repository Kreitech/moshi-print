import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CustomerDetail } from "@/components/features/customers/customer-detail";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  // RLS returns null if customer belongs to a different tenant
  if (!customer) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">← Clientes</Link>
        </Button>
      </div>

      <CustomerDetail customer={customer} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <p className="text-sm text-muted-foreground">
          Los pedidos aparecerán aquí una vez creados.
        </p>
      </section>
    </div>
  );
}
