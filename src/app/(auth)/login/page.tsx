import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage({ searchParams }: { searchParams: { mode?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">MoshiPrint</h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para continuar
          </p>
        </div>
        <LoginForm initialMode={searchParams.mode === "magic-link" || searchParams.mode === "forgot-password"
          ? searchParams.mode : "password"} />
      </div>
    </div>
  );
}
