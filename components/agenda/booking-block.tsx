import type { EnrichedBooking } from "@/lib/data"
import type { BookingStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  formatTimeRange,
  minutesSinceMidnight,
  durationMinutes,
} from "@/lib/date-utils"
import { PAYMENT_META, STATUS_META } from "@/lib/booking-display"
import { START_HOUR, HOUR_PX } from "./constants"

// Static tinted-block classes per status (left accent + soft fill).
const BLOCK_CLASSES: Record<BookingStatus, string> = {
  confirmed: "border-l-status-confirmed bg-status-confirmed/8 text-status-confirmed",
  pending: "border-l-status-pending bg-status-pending/8 text-status-pending",
  cancelled: "border-l-status-cancelled bg-status-cancelled/8 text-status-cancelled",
  completed: "border-l-status-completed bg-status-completed/8 text-status-completed",
  no_show: "border-l-status-no-show bg-status-no-show/8 text-status-no-show",
}

interface BookingBlockProps {
  booking: EnrichedBooking
}

export function BookingBlock({ booking }: BookingBlockProps) {
  const top =
    ((minutesSinceMidnight(booking.startsAt) - START_HOUR * 60) / 60) * HOUR_PX
  const height = (durationMinutes(booking.startsAt, booking.endsAt) / 60) * HOUR_PX

  const isCancelled = booking.status === "cancelled"

  return (
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-md border border-border border-l-4 bg-card px-2 py-1",
        BLOCK_CLASSES[booking.status],
        isCancelled && "opacity-60",
      )}
      style={{ top, height: Math.max(height - 2, 22) }}
    >
      <p className="font-mono text-[11px] font-medium leading-tight tabular-nums">
        {formatTimeRange(booking.startsAt, booking.endsAt)}
      </p>
      <p className="truncate text-xs font-medium leading-tight text-foreground">
        {booking.client.fullName}
      </p>
      {height >= HOUR_PX && (
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {STATUS_META[booking.status].label} · {PAYMENT_META[booking.paymentStatus]}
        </p>
      )}
    </div>
  )
}
