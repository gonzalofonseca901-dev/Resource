// Location fetchers. Scoping to a user's accessible locations is enforced here
// (mirrors a RLS policy / `.in('id', user.locationIds)` filter on Supabase).

import type { Location, User } from "@/lib/types"
import { canAccessLocation } from "@/lib/permissions"
import { MOCK_LOCATIONS } from "@/lib/mock-data"

/** All active locations for the business. */
export async function getLocations(): Promise<Location[]> {
  return MOCK_LOCATIONS.filter((location) => location.isActive)
}

/** A single location by id, or null. */
export async function getLocationById(locationId: string): Promise<Location | null> {
  return MOCK_LOCATIONS.find((location) => location.id === locationId) ?? null
}

/**
 * Locations the given user is allowed to see.
 * A user with an empty `locationIds` sees every active location.
 */
export async function getLocationsForUser(user: User): Promise<Location[]> {
  const locations = await getLocations()
  return locations.filter((location) => canAccessLocation(user, location.id))
}
