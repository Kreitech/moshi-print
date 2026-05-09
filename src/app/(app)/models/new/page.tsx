import Link from "next/link";
import { ModelForm } from "@/components/features/models/model-form";

export default function NewModelPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href="/models" className="text-sm text-muted-foreground hover:underline">
          ← Modelos
        </Link>
        <h1 className="text-2xl font-bold mt-1">Nuevo modelo</h1>
      </div>
      <ModelForm />
    </div>
  );
}
