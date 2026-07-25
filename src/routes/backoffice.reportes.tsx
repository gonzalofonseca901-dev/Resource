import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { PlanLockedFeature } from "@/components/plan-locked-feature";
import { revenueByMonth, topServices, currency } from "@/lib/mock-data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/backoffice/reportes")({
  component: ReportsPage,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reportes" description="Métricas de ingresos, ocupación y servicios." />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos mensuales</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => currency(v)} />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de servicios</CardTitle>
            <CardDescription>Por categoría</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topServices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {topServices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <PlanLockedFeature
            title="Reportes avanzados"
            description="Análisis de retención, cohortes de clientes y proyección de ingresos disponibles en el plan Premium."
            requiredPlan="Premium"
          >
            <div className="h-64" />
          </PlanLockedFeature>
        </div>
      </div>
    </div>
  );
}
