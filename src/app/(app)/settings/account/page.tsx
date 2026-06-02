import { ChangePasswordForm } from "@/components/features/settings/change-password-form";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Actualiza tu contraseña de acceso.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
