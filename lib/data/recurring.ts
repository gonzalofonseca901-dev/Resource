// Recurring-series fetchers, implementación real. `resource_id` tiene FK real
// a `resources`, así que la location se embebe anidada a través del recurso
// (resource:resources(*, location:locations(*))) — recurring_bookings.location_id
// existe denormalizado (002) pero sin FK explícita, así que no se puede embeber
// directo; para FILTRAR sí sirve una columna plana sin FK.

import { createClient } from "@/lib/supabase/server"
import type { EnrichedRecurringBooking } from "./types"

const SELECT = "*, client:end_clients(*), resource:resources(*, location:locations(*))"

// biome-ignore lint: shape viene directo de PostgREST, se mapea explícito abajo
function mapRow(row: any): EnrichedRecurringBooking | null {
  if (!row.client || !row.resource || !row.resource.location) return null

  return {
    id: row.id,
    resourceId: row.resource_id,
    endClientId: row.end_client_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    validFrom: row.valid_from,
    validUntil: row.valid_until ?? undefined,
    status: row.status,
    price: Number(row.price ?? 0),
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
      id: row.resource.location.id,
      businessId: row.resource.location.business_id,
      name: row.resource.location.name,
      address: row.resource.location.address ?? "",
      city: row.resource.location.city ?? "",
      phone: row.resource.location.phone ?? "",
      whatsappNumber: row.resource.location.whatsapp_number ?? "",
      timezone: row.resource.location.timezone,
      isActive: row.resource.location.is_active,
    },
  }
}

/**
 * Fechas canceladas puntualmente (excepciones tipo 'cancelled') por serie,
 * para pintar esas ocurrencias como dadas de baja en la tabla.
 */
export async function getExceptionsBySeries(
  seriesIds: string[],
): Promise<Record<string, string[]>> {
  if (seriesIds.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("booking_exceptions")
    .select("recurring_booking_id, exception_date")
    .in("recurring_booking_id", seriesIds)
    .eq("type", "cancelled")

  if (error) throw new Error(`No se pudieron cargar las excepciones: ${error.message}`)

  const byseries: Record<string, string[]> = {}
  for (const id of seriesIds) byseries[id] = []
  for (const e of data ?? []) {
    byseries[e.recurring_booking_id]?.push(e.exception_date)
  }
  return byseries
}

/**
 * Enriched recurring series for the given locations, ordered by day of week
 * then start time so the table reads like a weekly plan.
 */
export async function getRecurringBookings(
  locationIds: string[],
): Promise<EnrichedRecurringBooking[]> {
  if (locationIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recurring_bookings")
    .select(SELECT)
    .in("location_id", locationIds)
    .order("day_of_week")
    .order("start_time")

  if (error) throw new Error(`No se pudieron cargar los turnos fijos: ${error.message}`)
  return (data ?? []).map(mapRow).filter((s): s is EnrichedRecurringBooking => s !== null)
}
