import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Panel de control</h1>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Bienvenido a MoshiPrint</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Comenzar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
