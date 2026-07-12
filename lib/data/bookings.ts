// Booking fetchers, implementación real. Usa el embedding de PostgREST para
// traer client/resource/location en un solo select, como haría un
// `.select('*, client:end_clients(*), resource:resources(*), location:locations(*)')`.

import { createClient } from "@/lib/supabase/server"
import type { EnrichedBooking } from "./types"

const SELECT = "*, client:end_clients(*), resource:resources(*), location:locations(*)"

// biome-ignore lint: shape viene directo de PostgREST, se mapea explícito abajo
function mapRow(row: any): EnrichedBooking | null {
  if (!row.client || !row.resource || !row.location) return null

  return {
    id: row.id,
    resourceId: row.resource_id,
    locationId: row.location_id,
    endClientId: row.end_client_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    source: row.source,
    price: Number(row.price ?? 0),
    paymentStatus: row.payment_status,
    client: {
      id: row.client.id,
      businessId: row.client.business_id,
      fullName: row.client.full_name,
      phone: row.client.phone,
      email: row.client.email ?? undefined,
      loyaltyPoints: row.client.loyalty_points,
      preferredChannel: row.client.preferred_channel,
    },
    resource: {
      id: row.resource.id,
      locationId: row.resource.location_id,
      businessId: row.resource.business_id,
      name: row.resource.name,
      type: row.resource.type ?? "other",
      description: row.resource.description ?? "",
      capacity: row.resource.capacity,
      isActive: row.resource.is_active,
    },
    location: {
      id: row.location.id,
      businessId: row.location.business_id,
      name: row.location.name,
      address: row.location.address ?? "",
      city: row.location.city ?? "",
      phone: row.location.phone ?? "",
      whatsappNumber: row.location.whatsapp_number ?? "",
      timezone: row.location.timezone,
      isActive: row.location.is_active,
    },
  }
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
  if (locationIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .in("location_id", locationIds)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at")

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`)
  return (data ?? []).map(mapRow).filter((b): b is EnrichedBooking => b !== null)
}

/**
 * All enriched bookings for the given locations, newest first.
 * Client-side filtering (status, resource, date range) is applied by the view.
 */
export async function getBookings(locationIds: string[]): Promise<EnrichedBooking[]> {
  if (locationIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .in("location_id", locationIds)
    .order("starts_at", { ascending: false })

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`)
  return (data ?? []).map(mapRow).filter((b): b is EnrichedBooking => b !== null)
}

/** Full booking history for a single client, newest first. */
export async function getBookingsByClient(clientId: string): Promise<EnrichedBooking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .eq("end_client_id", clientId)
    .order("starts_at", { ascending: false })

  if (error) throw new Error(`No se pudieron cargar las reservas del cliente: ${error.message}`)
  return (data ?? []).map(mapRow).filter((b): b is EnrichedBooking => b !== null)
}
