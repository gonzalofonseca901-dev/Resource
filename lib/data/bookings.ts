// Booking fetchers. Returns EnrichedBooking (booking + joined client/resource/
// location), matching a Supabase select with embedded relations.

import type { Booking } from "@/lib/types"
import {
  MOCK_BOOKINGS,
  MOCK_END_CLIENTS,
  MOCK_LOCATIONS,
  MOCK_RESOURCES,
} from "@/lib/mock-data"
import type { EnrichedBooking } from "./types"

/** Join a raw booking with its related entities. */
function enrich(booking: Booking): EnrichedBooking | null {
  const client = MOCK_END_CLIENTS.find((c) => c.id === booking.endClientId)
  const resource = MOCK_RESOURCES.find((r) => r.id === booking.resourceId)
  const location = MOCK_LOCATIONS.find((l) => l.id === booking.locationId)
  if (!client || !resource || !location) return null
  return { ...booking, client, resource, location }
}

/**
 * Enriched bookings for the given locations within a [from, to) date range.
 * `from`/`to` are compared against each booking's `startsAt`.
 */
export async function getBookingsByDateRange(
  locationIds: string[],
  from: Date,
  to: Date,
): Promise<EnrichedBooking[]> {
  const allowed = new Set(locationIds)
  const fromMs = from.getTime()
  const toMs = to.getTime()

  return MOCK_BOOKINGS.filter((booking) => {
    if (!allowed.has(booking.locationId)) return false
    const startMs = new Date(booking.startsAt).getTime()
    return startMs >= fromMs && startMs < toMs
  })
    .map(enrich)
    .filter((b): b is EnrichedBooking => b !== null)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
}

/**
 * All enriched bookings for the given locations, newest first.
 * Mirrors `.in('location_id', locationIds).order('starts_at', desc)`.
 * Client-side filtering (status, resource, date range) is applied by the view.
 */
export async function getBookings(locationIds: string[]): Promise<EnrichedBooking[]> {
  const allowed = new Set(locationIds)
  return MOCK_BOOKINGS.filter((booking) => allowed.has(booking.locationId))
    .map(enrich)
    .filter((b): b is EnrichedBooking => b !== null)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
}

/** Full booking history for a single client, newest first. */
export async function getBookingsByClient(clientId: string): Promise<EnrichedBooking[]> {
  return MOCK_BOOKINGS.filter((booking) => booking.endClientId === clientId)
    .map(enrich)
    .filter((b): b is EnrichedBooking => b !== null)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
}
