import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type;
  const login = type === "recovery" ? "/login?mode=forgot-password" : "/login?mode=magic-link";
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>No pudimos verificar el enlace</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {type === "invite"
            ? "Pedile al propietario del equipo que reenvíe la invitación."
            : "Abrí el enlace más reciente en el navegador donde lo solicitaste o pedí uno nuevo."}
        </CardContent>
        <CardFooter>
          <Button asChild><Link href={type === "invite" ? "/login" : login}>Volver al acceso</Link></Button>
        </CardFooter>
      </Card>
    </main>
  );
}
