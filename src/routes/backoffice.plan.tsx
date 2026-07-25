import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { fetchPlanOverview, changePlan, type PlanRow } from "@/lib/data/plan";
import { useBusinessContext } from "@/lib/business-context";

export const Route = createFileRoute("/backoffice/plan")({
  component: PlanPage,
});

const FEATURE_LABELS: Record<string, string> = {
  multi_location: "Multi-sucursal",
  mercado_pago_deposits: "Señas con Mercado Pago",
  coupons: "Cupones de descuento",
  loyalty_program: "Programa de puntos",
  client_login: "Login de clientes",
  session_reminders: "Recordatorios automáticos",
  review_requests: "Pedido de reseñas",
  exportable_reports: "Reportes exportables",
  embeddable_widget: "Widget embebible",
  custom_domain: "Dominio propio",
};

function featureRows(p: PlanRow) {
  return Object.entries(FEATURE_LABELS).map(([key, label]) => ({
    key,
    label,
    enabled: Boolean(p.features[key]),
  }));
}

function limitLine(p: PlanRow) {
  const maxProf = p.features.max_professionals;
  return maxProf === null || maxProf === undefined
    ? "Profesionales ilimitados"
    : `Hasta ${maxProf} profesional${Number(maxProf) === 1 ? "" : "es"}`;
}

function PlanPage() {
  const { app_business_id: businessId } = useBusinessContext();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["plan-overview", businessId],
    queryFn: () => fetchPlanOverview(businessId!),
    enabled: Boolean(businessId),
  });

  const mutation = useMutation({
    mutationFn: (planId: string) => changePlan(businessId!, planId),
    onSuccess: () => {
      toast.success("Plan actualizado");
      queryClient.invalidateQueries({ queryKey: ["plan-overview", businessId] });
    },
    onError: () => toast.error("No se pudo cambiar el plan"),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Cargando plan...</div>;
  if (isError || !data)
    return <div className="p-6 text-sm text-destructive">No se pudo cargar el plan.</div>;

  return (
    <div>
      <PageHeader
        title="Plan y facturación"
        description="Gestioná tu suscripción y método de pago."
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan actual: {data.currentPlanName}</CardTitle>
            <CardDescription>
              {data.businessName} · estado: {data.subscriptionStatus}
              {data.currentPeriodEnd
                ? ` · se renueva el ${new Date(data.currentPeriodEnd).toLocaleDateString("es-AR")}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" disabled>
              Gestionar método de pago (próximamente)
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {data.plans.map((p) => {
            const isCurrent = p.name === data.currentPlanName;
            return (
              <Card key={p.id} className={isCurrent ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{p.name}</CardTitle>
                    {isCurrent ? <Badge>Actual</Badge> : null}
                  </div>
                  <CardDescription>{limitLine(p)}</CardDescription>
                  <p className="pt-2 text-3xl font-semibold">
                    {p.price ? `$${p.price.toLocaleString("es-AR")}` : "$0"}
                    <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm">
                    {featureRows(p).map((f) => (
                      <li key={f.key} className="flex items-start gap-2">
                        {f.enabled ? (
                          <Check className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={f.enabled ? "" : "text-muted-foreground"}>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || mutation.isPending}
                    onClick={() => mutation.mutate(p.id)}
                  >
                    {isCurrent ? "Plan actual" : "Cambiar a este plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
