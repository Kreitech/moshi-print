import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { ModelForm } from "@/components/features/models/model-form";

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);

  const { data: model } = await supabase
    .from("models")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant!.id)
    .maybeSingle();

  if (!model) notFound();

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href={`/models/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← {model.name}
        </Link>
        <h1 className="text-2xl font-bold mt-1">Editar modelo</h1>
      </div>
      <ModelForm initial={model} />
    </div>
  );
}
