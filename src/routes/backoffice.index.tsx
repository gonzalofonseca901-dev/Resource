import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { revenueByMonth, currency } from "@/lib/mock-data";
import { fetchAppointments } from "@/lib/data/appointments";
import { fetchClients } from "@/lib/data/clients";
import { useBusinessContext } from "@/lib/business-context";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/backoffice/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { app_business_id: businessId } = useBusinessContext();

  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["appointments", businessId],
    queryFn: () => fetchAppointments(businessId!),
    enabled: Boolean(businessId),
  });

  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: () => fetchClients(businessId!),
    enabled: Boolean(businessId),
  });

  if (loadingAppts || loadingClients) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando resumen...</div>;
  }

  const todayAppts = (appointments ?? []).filter((a) => {
    const d = new Date(a.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const revenueToday = todayAppts.reduce((sum, a) => sum + a.price, 0);

  // "Ocupación semanal" queda como valor de referencia (mock) hasta que se
  // defina la fórmula real (turnos confirmados / slots disponibles según
  // availability_rules) — ese cálculo es candidato a una vista materializada,
  // no algo para resolver ad-hoc en el componente.
  const stats = [
    {
      label: "Turnos hoy",
      value: todayAppts.length,
      icon: Calendar,
      hint: `${todayAppts.filter((a) => a.status === "confirmado").length} confirmados · ${todayAppts.filter((a) => a.status === "pendiente").length} pendientes`,
    },
    {
      label: "Ingresos hoy",
      value: currency(revenueToday),
      icon: DollarSign,
      hint: "Turnos de hoy",
    },
    {
      label: "Clientes activos",
      value: clients?.length ?? 0,
      icon: Users,
      hint: "Total registrados",
    },
    {
      label: "Ocupación semanal",
      value: "—",
      icon: TrendingUp,
      hint: "Pendiente de definir fórmula",
    },
  ];

  return (
    <div>
      <PageHeader title="Inicio" description="Resumen de la operación en tiempo real." />
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{s.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos por mes</CardTitle>
            <CardDescription>
              Últimos 6 meses (dato de referencia, todavía no conectado)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => currency(v)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  fill="url(#rev)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos turnos</CardTitle>
            <CardDescription>Hoy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppts.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.service}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(a.date).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {a.staff}
                  </div>
                </div>
                <Badge variant={a.status === "confirmado" ? "default" : "secondary"}>
                  {a.status}
                </Badge>
              </div>
            ))}
            {todayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay turnos programados para hoy.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
