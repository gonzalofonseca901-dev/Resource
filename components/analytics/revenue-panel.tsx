import type { RevenueMetrics } from "@/lib/data"
import { formatCurrency } from "@/lib/date-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RevenuePanelProps {
  revenue: RevenueMetrics
}

/**
 * Financial breakdown. Rendered ONLY when the current user has the
 * analytics.view_financials permission — the page decides, not this component.
 */
export function RevenuePanel({ revenue }: RevenuePanelProps) {
  const maxWeekday = Math.max(1, ...revenue.byWeekday.map((p) => p.value))
  const maxResource = Math.max(1, ...revenue.byResource.map((p) => p.value))

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Ingresos</CardTitle>
          <p className="text-xs text-muted-foreground">Facturación estimada del período</p>
        </div>
        <Badge tone="warning">Solo gestión</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={formatCurrency(revenue.total)} highlight />
          <Stat label="Promedio / turno" value={formatCurrency(revenue.averagePerBooking)} />
          <Stat label="Cobrado" value={formatCurrency(revenue.collected)} />
          <Stat label="Por cobrar" value={formatCurrency(revenue.outstanding)} />
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Ingresos por día</h3>
          <div className="flex items-end justify-between gap-2 pt-2">
            {revenue.byWeekday.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-full max-w-8 rounded-t-sm bg-primary"
                    style={{ height: `${point.value === 0 ? 2 : (point.value / maxWeekday) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        {revenue.byResource.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium text-muted-foreground">Ingresos por recurso</h3>
            <ul className="flex flex-col gap-2.5">
              {revenue.byResource.map((row, index) => (
                <li key={`${row.label}-${index}`} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{row.label}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(row.value / maxResource) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "text-lg font-semibold tabular-nums"
            : "text-sm font-semibold tabular-nums text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}
