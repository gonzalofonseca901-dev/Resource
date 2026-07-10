"use client"

import { CalendarX2, MapPin, Ban } from "lucide-react"
import type { EnrichedRecurringBooking } from "@/lib/data"
import { formatCurrency, formatDayOfWeek, formatDateShort } from "@/lib/date-utils"
import { RECURRING_STATUS_META } from "@/lib/booking-display"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Static class strings so Tailwind keeps them at build time.
const BADGE_CLASSES: Record<string, string> = {
  "status-confirmed":
    "bg-status-confirmed/10 text-status-confirmed border-status-confirmed/25",
  "status-pending": "bg-status-pending/10 text-status-pending border-status-pending/25",
  "status-cancelled":
    "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/25",
}

interface RecurringTableProps {
  series: EnrichedRecurringBooking[]
  exceptions: Record<string, string[]>
  showLocation: boolean
  canCancel: boolean
  onCancel: (series: EnrichedRecurringBooking) => void
}

function formatValidity(validFrom: string, validUntil?: string): string {
  const from = formatDateShort(`${validFrom}T00:00:00`)
  if (!validUntil) return `Desde ${from}`
  return `${from} – ${formatDateShort(`${validUntil}T00:00:00`)}`
}

export function RecurringTable({
  series,
  exceptions,
  showLocation,
  canCancel,
  onCancel,
}: RecurringTableProps) {
  if (series.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
        <CalendarX2 className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Sin turnos fijos</p>
        <p className="text-sm text-muted-foreground">
          Todavía no hay series recurrentes cargadas.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Día y horario
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Cliente
              </th>
              <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
                Cancha
              </th>
              <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">
                Vigencia
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Estado
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Precio
              </th>
              {canCancel && (
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const meta = RECURRING_STATUS_META[s.status]
              const seriesExceptions = exceptions[s.id] ?? []
              const isActive = s.status !== "cancelled"
              return (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <p className="font-medium capitalize">{formatDayOfWeek(s.dayOfWeek)}</p>
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">
                      {s.startTime} – {s.endTime}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium">{s.client.fullName}</p>
                    {seriesExceptions.length > 0 && (
                      <p className="text-xs text-status-cancelled">
                        {seriesExceptions.length} fecha
                        {seriesExceptions.length > 1 ? "s" : ""} cancelada
                        {seriesExceptions.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 align-top md:table-cell">
                    <p className="text-sm">{s.resource.name}</p>
                    {showLocation && (
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" aria-hidden="true" />
                        {s.location.city}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 align-top text-sm text-muted-foreground lg:table-cell">
                    {formatValidity(s.validFrom, s.validUntil)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                        BADGE_CLASSES[meta.token],
                      )}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top font-mono text-sm tabular-nums">
                    {formatCurrency(s.price, s.currency)}
                  </td>
                  {canCancel && (
                    <td className="px-4 py-3 text-right align-top">
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-status-cancelled hover:bg-status-cancelled/10 hover:text-status-cancelled"
                          onClick={() => onCancel(s)}
                        >
                          <Ban className="size-3.5" aria-hidden="true" />
                          Dar de baja
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
