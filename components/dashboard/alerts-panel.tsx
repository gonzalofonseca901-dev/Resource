import { AlertTriangle, Ban, Wallet } from "lucide-react"
import type { EnrichedBooking } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTime } from "@/lib/date-utils"
import { formatCurrency } from "@/lib/date-utils"
import { PAYMENT_META } from "@/lib/booking-display"

interface AlertsPanelProps {
  noShowAlerts: EnrichedBooking[]
  unpaidAlerts: EnrichedBooking[]
}

export function AlertsPanel({ noShowAlerts, unpaidAlerts }: AlertsPanelProps) {
  const isEmpty = noShowAlerts.length === 0 && unpaidAlerts.length === 0

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <AlertTriangle className="size-4 text-status-pending" aria-hidden="true" />
        <CardTitle>Alertas del día</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isEmpty && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todo en orden. No hay alertas por ahora.
          </p>
        )}

        {noShowAlerts.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-status-no-show">
              <Ban className="size-3.5" aria-hidden="true" />
              Ausencias ({noShowAlerts.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {noShowAlerts.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-status-no-show/20 bg-status-no-show/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{booking.client.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {booking.resource.name}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTime(booking.startsAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unpaidAlerts.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-status-pending">
              <Wallet className="size-3.5" aria-hidden="true" />
              Pagos pendientes ({unpaidAlerts.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {unpaidAlerts.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-status-pending/20 bg-status-pending/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{booking.client.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PAYMENT_META[booking.paymentStatus]} · {formatTime(booking.startsAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                    {formatCurrency(booking.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
