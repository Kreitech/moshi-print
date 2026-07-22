import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { ProductDetail } from "@/components/features/products/product-detail";
import { ProductVariantsSection } from "@/components/features/products/product-variants-section";
import { ListingDraftsSection } from "@/components/features/products/listing-drafts-section";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: product } = await supabase
    .from("sellable_products")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant!.id)
    .maybeSingle();

  if (!product) notFound();

  const [variantsResult, listingsResult] = await Promise.all([
    supabase.from("product_variants").select("*").eq("product_id", id).order("created_at"),
    supabase.from("channel_listings").select("*").eq("product_id", id).order("created_at", { ascending: false }),
  ]);

  let licenseWarning: string | null = null;
  if (product.commercial_use_allowed === false) {
    licenseWarning =
      "El modelo de origen no permite uso comercial. No se debería publicar este producto.";
  } else if (product.commercial_use_allowed === null) {
    licenseWarning = "No está confirmada la licencia comercial de este modelo.";
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products" className="text-sm text-muted-foreground hover:underline">
          ← Productos
        </Link>
      </div>

      <ProductDetail product={product} />

      <ProductVariantsSection productId={product.id} variants={variantsResult.data ?? []} />

      <ListingDraftsSection
        productId={product.id}
        listings={listingsResult.data ?? []}
        licenseWarning={licenseWarning}
      />
    </div>
  );
}
