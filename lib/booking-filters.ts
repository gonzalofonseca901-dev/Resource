// Pure booking-filtering logic. Kept out of the UI so the view stays declarative
// and this can be reused (or moved server-side into a Supabase query) later.

import type { BookingStatus } from "@/lib/types"
import type { EnrichedBooking } from "@/lib/data"

export const ALL = "all"

export interface BookingFilters {
  locationId: string // location id or ALL
  resourceId: string // resource id or ALL
  status: BookingStatus | typeof ALL
  from: string // "YYYY-MM-DD" or "" (inclusive lower bound on the booking day)
  to: string // "YYYY-MM-DD" or "" (inclusive upper bound on the booking day)
}

export const EMPTY_BOOKING_FILTERS: BookingFilters = {
  locationId: ALL,
  resourceId: ALL,
  status: ALL,
  from: "",
  to: "",
}

/** Whether any narrowing filter is active (used to toggle the "clear" affordance). */
export function hasActiveBookingFilters(filters: BookingFilters): boolean {
  return (
    filters.locationId !== ALL ||
    filters.resourceId !== ALL ||
    filters.status !== ALL ||
    filters.from !== "" ||
    filters.to !== ""
  )
}

/** Apply the filter set to a list of enriched bookings. */
export function filterBookings(
  bookings: EnrichedBooking[],
  filters: BookingFilters,
): EnrichedBooking[] {
  const fromMs = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null
  const toMs = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null

  return bookings.filter((booking) => {
    if (filters.locationId !== ALL && booking.locationId !== filters.locationId) return false
    if (filters.resourceId !== ALL && booking.resourceId !== filters.resourceId) return false
    if (filters.status !== ALL && booking.status !== filters.status) return false

    const startMs = new Date(booking.startsAt).getTime()
    if (fromMs !== null && startMs < fromMs) return false
    if (toMs !== null && startMs > toMs) return false

    return true
  })
}
