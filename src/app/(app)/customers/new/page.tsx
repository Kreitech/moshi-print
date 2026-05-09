import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/features/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">← Volver</Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo cliente</h1>
      </div>

      <CustomerForm />
    </div>
  );
}
