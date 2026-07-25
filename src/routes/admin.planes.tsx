import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PLAN_ALLOWS_CUSTOM_DOMAIN, PLAN_LABELS, type Plan } from "@/lib/tenants";

export const Route = createFileRoute("/admin/planes")({
  component: PlanesPage,
});

const planIds: Plan[] = ["basico", "pro", "premium"];

const featureRows: { label: string; values: Record<Plan, boolean> }[] = [
  { label: "Sitio público (subdominio)", values: { basico: true, pro: true, premium: true } },
  { label: "Agenda y turnos ilimitados", values: { basico: false, pro: true, premium: true } },
  { label: "Multi-sucursal", values: { basico: false, pro: false, premium: true } },
  { label: "Reportes avanzados", values: { basico: false, pro: false, premium: true } },
  { label: "Dominio propio", values: PLAN_ALLOWS_CUSTOM_DOMAIN },
];

function PlanesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Qué feature está disponible en cada plan — hoy es la fuente que consultan{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">ajustes</code> y{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">plan</code> del backoffice para
          mostrar/bloquear features.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de features</CardTitle>
          <CardDescription>
            Mock — src/lib/tenants.ts (PLAN_ALLOWS_CUSTOM_DOMAIN y afines).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 font-medium">Feature</th>
                {planIds.map((p) => (
                  <th key={p} className="py-2 text-center font-medium">
                    {PLAN_LABELS[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="py-3">{row.label}</td>
                  {planIds.map((p) => (
                    <td key={p} className="py-3 text-center">
                      {row.values[p] ? (
                        <Check className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
