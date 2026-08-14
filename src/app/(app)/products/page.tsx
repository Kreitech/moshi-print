import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { Button } from "@/components/ui/button";
import { ProductStatusBadge } from "@/components/features/products/product-status-badge";
import { type SellableProductStatus } from "@/types/database";

const ALL_STATUSES: SellableProductStatus[] = [
  "draft",
  "ready",
  "published",
  "paused",
  "archived",
];

const STATUS_LABELS: Record<SellableProductStatus, string> = {
  draft: "Borrador",
  ready: "Listo",
  published: "Publicado",
  paused: "Pausado",
  archived: "Archivado",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  let query = supabase
    .from("sellable_products")
    .select("*")
    .eq("tenant_id", tenant!.id)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: products } = await query;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button asChild size="sm">
          <Link href="/products/new">+ Nuevo producto</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Link
          href="/products"
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            !params.status ? "bg-foreground text-background" : "hover:bg-muted"
          }`}
        >
          Todos
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/products?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              params.status === s ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {products && products.length > 0 ? (
        <div className="space-y-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-0.5">
                <p className="font-medium">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {product.base_price_amount != null && (
                  <span className="text-xs text-muted-foreground">
                    {product.base_price_amount.toLocaleString("es-UY", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    {product.base_price_currency ?? "UYU"}
                  </span>
                )}
                <ProductStatusBadge status={product.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {params.status
              ? "No hay productos con ese filtro."
              : "Todavía no hay productos. Crea el primero."}
          </p>
          {!params.status && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/products/new">+ Nuevo producto</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
