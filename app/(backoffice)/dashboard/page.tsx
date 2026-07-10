import { getCurrentUser, getDashboardMetrics, getLocationsForUser } from "@/lib/data"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricsRow } from "@/components/dashboard/metrics-row"
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const [metrics, locations] = await Promise.all([
    getDashboardMetrics(user),
    getLocationsForUser(user),
  ])

  const locationsLabel =
    user.locationIds.length === 0
      ? "Todas las sedes"
      : locations.map((l) => l.name).join(" · ")

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader userName={user.fullName} locationsLabel={locationsLabel} />

      <MetricsRow metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <UpcomingAppointments bookings={metrics.upcomingToday} />
        <AlertsPanel
          noShowAlerts={metrics.noShowAlerts}
          unpaidAlerts={metrics.unpaidAlerts}
        />
      </div>
    </div>
  )
}
