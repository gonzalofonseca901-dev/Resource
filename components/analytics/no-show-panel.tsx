import type { NoShowMetrics } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NoShowPanelProps {
  noShow: NoShowMetrics
}

export function NoShowPanel({ noShow }: NoShowPanelProps) {
  const maxCount = Math.max(1, ...noShow.byWeekday.map((p) => p.value))

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Ausencias</CardTitle>
          <p className="text-xs text-muted-foreground">
            {noShow.count} ausencias sobre {noShow.totalBookings} turnos
          </p>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-status-cancelled">
          {`${Math.round(noShow.rate * 100)}%`}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Ausencias por día</h3>
        <div className="flex items-end justify-between gap-2 pt-2">
          {noShow.byWeekday.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t-sm bg-status-cancelled/70"
                  style={{ height: `${point.value === 0 ? 2 : (point.value / maxCount) * 100}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[0.7rem] tabular-nums text-muted-foreground">{point.value}</span>
              <span className="text-xs text-muted-foreground">{point.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
