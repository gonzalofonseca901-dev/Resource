import { redirect } from "next/navigation"
import { getAnalyticsMetrics, getCurrentUser } from "@/lib/data"
import { can, PERMISSIONS } from "@/lib/permissions"
import { OccupancyChart } from "@/components/analytics/occupancy-chart"
import { NoShowPanel } from "@/components/analytics/no-show-panel"
import { RetentionChart } from "@/components/analytics/retention-chart"
import { RevenuePanel } from "@/components/analytics/revenue-panel"

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const metrics = await getAnalyticsMetrics(user)

  // Revenue is always computed by the data layer, but only forwarded to the UI
  // when the user has analytics.view_financials. Staff never see this section.
  const canViewFinancials = can(user, PERMISSIONS.ANALYTICS_VIEW_FINANCIALS)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Analítica</h1>
        <p className="text-sm text-muted-foreground">
          Ocupación, ausencias y retención del complejo · {metrics.periodLabel}.
        </p>
      </div>

      {canViewFinancials && <RevenuePanel revenue={metrics.revenue} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OccupancyChart occupancy={metrics.occupancy} />
        <RetentionChart retention={metrics.retention} />
      </div>

      <NoShowPanel noShow={metrics.noShow} />
    </div>
  )
}
