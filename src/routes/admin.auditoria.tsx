import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/admin/auditoria")({
  component: AuditoriaPage,
});

const mockEvents = [
  { date: "2026-07-19T14:20:00Z", tenant: "bewoman", action: "Cambió el color primario de marca" },
  { date: "2026-07-18T10:05:00Z", tenant: "lunanails", action: "Se dio de alta en la plataforma" },
  { date: "2026-07-15T09:40:00Z", tenant: "bewoman", action: "Actualizó el plan a Pro" },
  { date: "2026-07-10T16:00:00Z", tenant: "bewoman", action: "Editó los horarios de atención" },
];

function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Mock por ahora — cuando haya backend, esto se llena con eventos reales (cambios de plan,
          de marca, altas, bajas).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <CardDescription>Últimos eventos en todos los negocios de la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockEvents.map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
            >
              <div>
                <span className="font-medium">{e.tenant}</span>
                <span className="text-muted-foreground"> — {e.action}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(e.date).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
