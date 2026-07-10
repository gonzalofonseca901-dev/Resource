import { cn } from "@/lib/utils"
import type { BookingStatus } from "@/lib/types"
import { STATUS_META } from "@/lib/booking-display"

// Static class strings per status so Tailwind can see them at build time.
const STATUS_CLASSES: Record<BookingStatus, string> = {
  confirmed: "bg-status-confirmed/10 text-status-confirmed border-status-confirmed/25",
  pending: "bg-status-pending/10 text-status-pending border-status-pending/25",
  cancelled: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/25",
  completed: "bg-status-completed/10 text-status-completed border-status-completed/25",
  no_show: "bg-status-no-show/10 text-status-no-show border-status-no-show/25",
}

const DOT_CLASSES: Record<BookingStatus, string> = {
  confirmed: "bg-status-confirmed",
  pending: "bg-status-pending",
  cancelled: "bg-status-cancelled",
  completed: "bg-status-completed",
  no_show: "bg-status-no-show",
}

interface StatusBadgeProps {
  status: BookingStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", DOT_CLASSES[status])}
        />
      )}
      {STATUS_META[status].label}
    </span>
  )
}
