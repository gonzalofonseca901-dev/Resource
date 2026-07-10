"use client"

import { CalendarX2, MapPin, Pencil, Ban } from "lucide-react"
import type { EnrichedBooking } from "@/lib/data"
import { formatCurrency, formatDateShort, formatTimeRange } from "@/lib/date-utils"
import { PAYMENT_META, SOURCE_META } from "@/lib/booking-display"
import { StatusBadge } from "@/components/booking/status-badge"
import { Button } from "@/components/ui/button"
import type { BookingPermissions } from "./bookings-view"

interface BookingsTableProps {
  bookings: EnrichedBooking[]
  totalCount: number
  showLocation: boolean
  permissions: BookingPermissions
  onEdit: (booking: EnrichedBooking) => void
  onCancel: (booking: EnrichedBooking) => void
}

// A booking can only be cancelled while it is still upcoming/active.
function isCancellable(booking: EnrichedBooking): boolean {
  return booking.status === "confirmed" || booking.status === "pending"
}

export function BookingsTable({
  bookings,
  totalCount,
  showLocation,
  permissions,
  onEdit,
  onCancel,
}: BookingsTableProps) {
  const showActions = permissions.canEdit || permissions.canCancel

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
        <CalendarX2 className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Sin reservas para mostrar</p>
        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? "Todavía no hay reservas cargadas."
            : "Ninguna reserva coincide con los filtros actuales."}
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
                Fecha y hora
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Cliente
              </th>
              <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
                Cancha
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Estado
              </th>
              <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                Pago
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Precio
              </th>
              {showActions && (
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const canEdit = permissions.canEdit && booking.status !== "cancelled"
              const canCancel = permissions.canCancel && isCancellable(booking)
              return (
                <tr
                  key={booking.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <p className="font-mono text-sm font-medium tabular-nums">
                      {formatDateShort(booking.startsAt)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">
                      {formatTimeRange(booking.startsAt, booking.endsAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium">{booking.client.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {SOURCE_META[booking.source]}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 align-top md:table-cell">
                    <p className="text-sm">{booking.resource.name}</p>
                    {showLocation && (
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" aria-hidden="true" />
                        {booking.location.city}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="hidden px-4 py-3 align-top text-sm text-muted-foreground sm:table-cell">
                    {PAYMENT_META[booking.paymentStatus]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top font-mono text-sm tabular-nums">
                    {formatCurrency(booking.price)}
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Editar reserva de ${booking.client.fullName}`}
                            onClick={() => onEdit(booking)}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Cancelar reserva de ${booking.client.fullName}`}
                            className="text-status-cancelled hover:bg-status-cancelled/10 hover:text-status-cancelled"
                            onClick={() => onCancel(booking)}
                          >
                            <Ban className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
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
