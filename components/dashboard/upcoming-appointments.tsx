import { CalendarClock } from "lucide-react"
import type { EnrichedBooking } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingListItem } from "@/components/booking/booking-list-item"

interface UpcomingAppointmentsProps {
  bookings: EnrichedBooking[]
}

export function UpcomingAppointments({ bookings }: UpcomingAppointmentsProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Próximos turnos</CardTitle>
        <span className="text-xs text-muted-foreground">{bookings.length} por venir</span>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarClock className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No quedan turnos por delante para hoy.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map((booking) => (
              <BookingListItem key={booking.id} booking={booking} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
