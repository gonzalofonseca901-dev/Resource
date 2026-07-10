// Recurring-series fetchers. Returns EnrichedRecurringBooking (series + joined
// client/resource/location), matching a Supabase select with nested relations.
// The location is resolved through the series' resource.

import type { RecurringBooking } from "@/lib/types"
import {
  MOCK_END_CLIENTS,
  MOCK_LOCATIONS,
  MOCK_RECURRING_BOOKINGS,
  MOCK_RESOURCES,
} from "@/lib/mock-data"
import type { EnrichedRecurringBooking } from "./types"

/** Join a raw series with its client, resource and (resource-derived) location. */
function enrich(series: RecurringBooking): EnrichedRecurringBooking | null {
  const client = MOCK_END_CLIENTS.find((c) => c.id === series.endClientId)
  const resource = MOCK_RESOURCES.find((r) => r.id === series.resourceId)
  if (!client || !resource) return null
  const location = MOCK_LOCATIONS.find((l) => l.id === resource.locationId)
  if (!location) return null
  return { ...series, client, resource, location }
}

/**
 * Enriched recurring series for the given locations, ordered by day of week
 * then start time so the table reads like a weekly plan.
 */
export async function getRecurringBookings(
  locationIds: string[],
): Promise<EnrichedRecurringBooking[]> {
  const allowed = new Set(locationIds)
  return MOCK_RECURRING_BOOKINGS.map(enrich)
    .filter((s): s is EnrichedRecurringBooking => s !== null)
    .filter((s) => allowed.has(s.location.id))
    .sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
      return a.startTime.localeCompare(b.startTime)
    })
}
