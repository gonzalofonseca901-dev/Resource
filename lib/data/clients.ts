// End-client fetchers, implementación real. Stats (totalBookings, lastVisit)
// se calculan en JS sobre un solo select de bookings, para evitar N+1 queries.

import type { EndClient } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import type { ClientWithStats } from "./types"

function mapClient(row: {
  id: string
  business_id: string
  full_name: string
  phone: string
  email: string | null
  loyalty_points: number
  preferred_channel: string | null
}): EndClient {
  return {
    id: row.id,
    businessId: row.business_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    loyaltyPoints: row.loyalty_points,
    preferredChannel: (row.preferred_channel as EndClient["preferredChannel"]) ?? "whatsapp",
  }
}

/** All clients for a business with list stats, ordered by name. */
export async function getClients(businessId: string): Promise<ClientWithStats[]> {
  const supabase = await createClient()

  const [{ data: clients, error: clientsError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
      supabase.from("end_clients").select("*").eq("business_id", businessId).order("full_name"),
      supabase
        .from("bookings")
        .select("end_client_id, starts_at, status")
        .eq("business_id", businessId),
    ])

  if (clientsError) throw new Error(`No se pudieron cargar los clientes: ${clientsError.message}`)
  if (bookingsError) throw new Error(`No se pudieron cargar las reservas: ${bookingsError.message}`)

  const now = Date.now()
  const byClient = new Map<string, { total: number; lastVisit: string | null }>()

  for (const b of bookings ?? []) {
    const entry = byClient.get(b.end_client_id) ?? { total: 0, lastVisit: null }
    entry.total += 1
    const startMs = new Date(b.starts_at).getTime()
    if (
      b.status !== "cancelled" &&
      startMs <= now &&
      (!entry.lastVisit || startMs > new Date(entry.lastVisit).getTime())
    ) {
      entry.lastVisit = b.starts_at
    }
    byClient.set(b.end_client_id, entry)
  }

  return (clients ?? []).map((c) => {
    const stats = byClient.get(c.id) ?? { total: 0, lastVisit: null }
    return { ...mapClient(c), totalBookings: stats.total, lastVisit: stats.lastVisit }
  })
}

/** A single client by id, or null. */
export async function getClientById(clientId: string): Promise<EndClient | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("end_clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar el cliente: ${error.message}`)
  return data ? mapClient(data) : null
}
