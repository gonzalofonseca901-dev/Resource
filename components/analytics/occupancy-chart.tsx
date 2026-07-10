import type { OccupancyMetrics } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OccupancyChartProps {
  occupancy: OccupancyMetrics
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function OccupancyChart({ occupancy }: OccupancyChartProps) {
  const maxResource = Math.max(
    1,
    ...occupancy.byResource.map((r) => r.primary + r.secondary),
  )

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Ocupación</CardTitle>
          <p className="text-xs text-muted-foreground">
            {occupancy.bookedSlots} de {occupancy.availableSlots} turnos vendidos
          </p>
        </div>
        <span className="text-2xl font-semibold tabular-nums">{pct(occupancy.rate)}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Ocupación por día</h3>
          <div className="flex items-end justify-between gap-2 pt-2">
            {occupancy.byWeekday.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-full max-w-8 rounded-t-sm bg-primary"
                    style={{ height: `${Math.max(point.value * 100, 2)}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                  {pct(point.value)}
                </span>
                <span className="text-xs text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">Por recurso</h3>
          <ul className="flex flex-col gap-2.5">
            {occupancy.byResource.map((row, index) => {
              const total = row.primary + row.secondary
              return (
                <li key={`${row.label}-${index}`} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.primary}/{total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(row.primary / maxResource) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </CardContent>
    </Card>
  )
}
