"use client"

import type { EnrichedBooking } from "@/lib/data"
import { formatDateShort, formatTimeRange } from "@/lib/date-utils"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

interface CancelBookingDialogProps {
  booking: EnrichedBooking | null
  onClose: () => void
  onConfirm: () => void
}

export function CancelBookingDialog({
  booking,
  onClose,
  onConfirm,
}: CancelBookingDialogProps) {
  return (
    <Modal
      open={booking !== null}
      onClose={onClose}
      title="Cancelar reserva"
      description="Esta acción marca la reserva como cancelada y libera el turno."
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose}>
            Volver
          </Button>
          <Button variant="destructive" size="lg" onClick={onConfirm}>
            Cancelar reserva
          </Button>
        </>
      }
    >
      {booking && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/40 p-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">{booking.client.fullName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cancha</span>
            <span className="font-medium">{booking.resource.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-mono tabular-nums">
              {formatDateShort(booking.startsAt)} ·{" "}
              {formatTimeRange(booking.startsAt, booking.endsAt)}
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
