import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MESSAGES: Record<string, string> = {
  recovery: "El enlace para restablecer tu contraseña no es válido o ya expiró.",
  invite: "El enlace de invitación no es válido o ya expiró.",
  signup: "El enlace de confirmación no es válido o ya expiró.",
  magiclink: "El enlace de acceso no es válido o ya expiró.",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const { type } = searchParams;
  const message = (type && MESSAGES[type]) || "El enlace no es válido o ya expiró.";
  const isInvite = type === "invite";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Enlace inválido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{message}</p>
          {isInvite ? (
            <p>
              Pedile a quien te invitó que te reenvíe la invitación desde
              Configuración &gt; Equipo.
            </p>
          ) : (
            <p>
              Podés solicitar un nuevo enlace desde la pantalla de inicio de
              sesión, usando &quot;¿Olvidaste tu contraseña?&quot;.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Volver a inicio de sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
