import { MapPin } from "lucide-react"
import type { EnrichedBooking } from "@/lib/data"
import { formatTimeRange } from "@/lib/date-utils"
import { PAYMENT_META, SOURCE_META } from "@/lib/booking-display"
import { StatusBadge } from "./status-badge"

interface BookingListItemProps {
  booking: EnrichedBooking
  showLocation?: boolean
}

export function BookingListItem({ booking, showLocation = true }: BookingListItemProps) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="w-24 shrink-0">
        <p className="font-mono text-sm font-medium tabular-nums">
          {formatTimeRange(booking.startsAt, booking.endsAt)}
        </p>
        <p className="text-xs text-muted-foreground">{SOURCE_META[booking.source]}</p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{booking.client.fullName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {booking.resource.name}
          {showLocation && (
            <span className="inline-flex items-center gap-1">
              {" · "}
              <MapPin className="size-3" aria-hidden="true" />
              {booking.location.city}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={booking.status} />
        <span className="text-xs text-muted-foreground">
          {PAYMENT_META[booking.paymentStatus]}
        </span>
      </div>
    </li>
  )
}
