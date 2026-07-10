import { CalendarClock, CircleCheck, Clock, Wallet } from "lucide-react"
import type { DashboardMetrics } from "@/lib/data"
import { formatCurrency } from "@/lib/date-utils"
import { MetricCard } from "./metric-card"

interface MetricsRowProps {
  metrics: DashboardMetrics
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="Reservas de hoy"
        value={String(metrics.bookingsToday)}
        hint={`${metrics.confirmedToday} confirmadas`}
        icon={CalendarClock}
      />
      <MetricCard
        label="Confirmadas"
        value={String(metrics.confirmedToday)}
        hint="Listas para jugar"
        icon={CircleCheck}
      />
      <MetricCard
        label="Pendientes"
        value={String(metrics.pendingToday)}
        hint="Esperando confirmación"
        icon={Clock}
        tone={metrics.pendingToday > 0 ? "warning" : "default"}
      />
      <MetricCard
        label="Ingreso estimado"
        value={formatCurrency(metrics.estimatedRevenueToday)}
        hint="Del día de hoy"
        icon={Wallet}
      />
    </div>
  )
}
