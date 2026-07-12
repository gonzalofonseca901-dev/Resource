// Resource fetchers, scoped by location. RLS filtra por business_id; acá
// filtramos por location_id como pedía la firma original.

import type { Resource } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

function mapResource(row: {
  id: string
  location_id: string
  business_id: string
  name: string
  type: string | null
  description: string | null
  capacity: number
  is_active: boolean
}): Resource {
  return {
    id: row.id,
    locationId: row.location_id,
    businessId: row.business_id,
    name: row.name,
    type: (row.type as Resource["type"]) ?? "other",
    description: row.description ?? "",
    capacity: row.capacity,
    isActive: row.is_active,
  }
}

/** Active resources for a single location. */
export async function getResourcesByLocation(locationId: string): Promise<Resource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("location_id", locationId)
    .eq("is_active", true)
    .order("name")

  if (error) throw new Error(`No se pudieron cargar los recursos: ${error.message}`)
  return (data ?? []).map(mapResource)
}

/**
 * Active resources across a set of locations, ordered by location then name so
 * agenda columns render in a stable order.
 */
export async function getResourcesByLocations(locationIds: string[]): Promise<Resource[]> {
  if (locationIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .in("location_id", locationIds)
    .eq("is_active", true)
    .order("location_id")
    .order("name")

  if (error) throw new Error(`No se pudieron cargar los recursos: ${error.message}`)
  return (data ?? []).map(mapResource)
}

/**
 * Every resource (active AND inactive) across a set of locations, for the
 * management screen where disabled resources must still be listed and edited.
 */
export async function getManagedResourcesByLocations(
  locationIds: string[],
): Promise<Resource[]> {
  if (locationIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .in("location_id", locationIds)
    .order("location_id")
    .order("name")

  if (error) throw new Error(`No se pudieron cargar los recursos: ${error.message}`)
  return (data ?? []).map(mapResource)
}
