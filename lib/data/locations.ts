// Location fetchers, implementación real. RLS ya filtra por business_id — acá
// solo agregamos el scoping de sede por usuario (locationIds vacío = todas).

import type { Location, User } from "@/lib/types"
import { canAccessLocation } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"

function mapLocation(row: {
  id: string
  business_id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  whatsapp_number: string | null
  timezone: string
  is_active: boolean
}): Location {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    address: row.address ?? "",
    city: row.city ?? "",
    phone: row.phone ?? "",
    whatsappNumber: row.whatsapp_number ?? "",
    timezone: row.timezone,
    isActive: row.is_active,
  }
}

/** All active locations for the business. */
export async function getLocations(): Promise<Location[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) throw new Error(`No se pudieron cargar las sedes: ${error.message}`)
  return (data ?? []).map(mapLocation)
}

/** A single location by id, or null. */
export async function getLocationById(locationId: string): Promise<Location | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", locationId)
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar la sede: ${error.message}`)
  return data ? mapLocation(data) : null
}

/**
 * Locations the given user is allowed to see.
 * A user with an empty `locationIds` sees every active location.
 */
export async function getLocationsForUser(user: User): Promise<Location[]> {
  const locations = await getLocations()
  return locations.filter((location) => canAccessLocation(user, location.id))
}
