// End-client fetchers. Search happens in the view over the returned set, but the
// signatures already match Supabase queries (e.g. `.ilike('full_name', ...)`).

import type { EndClient } from "@/lib/types"
import { MOCK_BOOKINGS, MOCK_END_CLIENTS } from "@/lib/mock-data"
import type { ClientWithStats } from "./types"

/** Attach booking count + last visit (most recent past booking) to a client. */
function withStats(client: EndClient): ClientWithStats {
  const now = Date.now()
  const clientBookings = MOCK_BOOKINGS.filter((b) => b.endClientId === client.id)
  const pastVisits = clientBookings
    .filter((b) => b.status !== "cancelled" && new Date(b.startsAt).getTime() <= now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

  return {
    ...client,
    totalBookings: clientBookings.length,
    lastVisit: pastVisits[0]?.startsAt ?? null,
  }
}

/** All clients for a business with list stats, ordered by name. */
export async function getClients(businessId: string): Promise<ClientWithStats[]> {
  return MOCK_END_CLIENTS.filter((c) => c.businessId === businessId)
    .map(withStats)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

/** A single client by id, or null. */
export async function getClientById(clientId: string): Promise<EndClient | null> {
  return MOCK_END_CLIENTS.find((c) => c.id === clientId) ?? null
}
