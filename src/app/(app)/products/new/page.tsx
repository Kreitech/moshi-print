import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { ProductForm } from "@/components/features/products/product-form";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ model_id?: string }>;
}) {
  const { model_id } = await searchParams;

  let prefill;
  if (model_id) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);
    const { data: model } = await supabase
      .from("models")
      .select("id, name, notes, commercial_use_allowed")
      .eq("id", model_id)
      .eq("tenant_id", tenant!.id)
      .maybeSingle();

    if (model) {
      prefill = {
        model_id: model.id,
        name: model.name,
        description: model.notes,
        commercial_use_allowed: model.commercial_use_allowed,
      };
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href="/products" className="text-sm text-muted-foreground hover:underline">
          ← Productos
        </Link>
        <h1 className="text-2xl font-bold mt-1">Nuevo producto</h1>
      </div>
      <ProductForm prefill={prefill} />
    </div>
  );
}
