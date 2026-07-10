import type { EnrichedBooking } from "@/lib/data"
import type { Resource } from "@/lib/types"
import { HOUR_LABELS, HOUR_PX, GRID_HEIGHT } from "./constants"
import { BookingBlock } from "./booking-block"

interface ResourceColumnProps {
  resource: Resource
  locationName: string
  bookings: EnrichedBooking[]
  showLocation: boolean
}

export function ResourceColumn({
  resource,
  locationName,
  bookings,
  showLocation,
}: ResourceColumnProps) {
  return (
    <div className="min-w-[168px] flex-1 border-l border-border">
      <div className="sticky top-0 z-10 flex h-12 flex-col justify-center border-b border-border bg-card px-3">
        <p className="truncate text-sm font-semibold leading-tight">{resource.name}</p>
        {showLocation && (
          <p className="truncate text-[11px] leading-tight text-muted-foreground">
            {locationName}
          </p>
        )}
      </div>

      <div className="relative" style={{ height: GRID_HEIGHT }}>
        {/* Hour grid lines — thin like court lines. */}
        {HOUR_LABELS.map((hour, index) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-t border-border/60"
            style={{ top: index * HOUR_PX }}
          />
        ))}
        {bookings.map((booking) => (
          <BookingBlock key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  )
}
