import type { RetentionMetrics } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RetentionChartProps {
  retention: RetentionMetrics
}

export function RetentionChart({ retention }: RetentionChartProps) {
  const maxDist = Math.max(1, ...retention.distribution.map((d) => d.value))

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Retención</CardTitle>
          <p className="text-xs text-muted-foreground">
            {retention.returningClients} de {retention.totalClients} clientes vuelven
          </p>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-status-confirmed">
          {`${Math.round(retention.rate * 100)}%`}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-md border border-border p-3">
            <span className="text-xs text-muted-foreground">Nuevos</span>
            <span className="text-lg font-semibold tabular-nums">{retention.newClients}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-md border border-border p-3">
            <span className="text-xs text-muted-foreground">Recurrentes</span>
            <span className="text-lg font-semibold tabular-nums">{retention.returningClients}</span>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">Distribución por reservas</h3>
          <ul className="flex flex-col gap-2.5">
            {retention.distribution.map((point) => (
              <li key={point.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{point.label}</span>
                  <span className="tabular-nums text-muted-foreground">{point.value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(point.value / maxDist) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  )
}
