// Resource fetchers, scoped by location.

import type { Resource } from "@/lib/types"
import { MOCK_RESOURCES } from "@/lib/mock-data"

/** Active resources for a single location. */
export async function getResourcesByLocation(locationId: string): Promise<Resource[]> {
  return MOCK_RESOURCES.filter(
    (resource) => resource.locationId === locationId && resource.isActive,
  )
}

/**
 * Active resources across a set of locations, ordered by location then name so
 * agenda columns render in a stable order.
 */
export async function getResourcesByLocations(locationIds: string[]): Promise<Resource[]> {
  const allowed = new Set(locationIds)
  return MOCK_RESOURCES.filter(
    (resource) => resource.isActive && allowed.has(resource.locationId),
  ).sort((a, b) => {
    if (a.locationId !== b.locationId) return a.locationId.localeCompare(b.locationId)
    return a.name.localeCompare(b.name)
  })
}

/**
 * Every resource (active AND inactive) across a set of locations, for the
 * management screen where disabled resources must still be listed and edited.
 * Mirrors a Supabase select without the `is_active` filter.
 */
export async function getManagedResourcesByLocations(
  locationIds: string[],
): Promise<Resource[]> {
  const allowed = new Set(locationIds)
  return MOCK_RESOURCES.filter((resource) => allowed.has(resource.locationId)).sort((a, b) => {
    if (a.locationId !== b.locationId) return a.locationId.localeCompare(b.locationId)
    return a.name.localeCompare(b.name)
  })
}
