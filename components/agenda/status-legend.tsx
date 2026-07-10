import type { BookingStatus } from "@/lib/types"
import { STATUS_META } from "@/lib/booking-display"
import { cn } from "@/lib/utils"

const DOT_CLASSES: Record<BookingStatus, string> = {
  confirmed: "bg-status-confirmed",
  pending: "bg-status-pending",
  cancelled: "bg-status-cancelled",
  completed: "bg-status-completed",
  no_show: "bg-status-no-show",
}

const ORDER: BookingStatus[] = ["confirmed", "pending", "completed", "no_show", "cancelled"]

export function StatusLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {ORDER.map((status) => (
        <li key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-2 rounded-full", DOT_CLASSES[status])} aria-hidden="true" />
          {STATUS_META[status].label}
        </li>
      ))}
    </ul>
  )
}
