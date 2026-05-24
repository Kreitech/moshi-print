import { UpdatePasswordForm } from "@/components/features/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu nueva contraseña para continuar
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
