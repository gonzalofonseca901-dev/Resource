"use client"

import { useMemo, useState } from "react"
import type { EnrichedBooking, ClientWithStats } from "@/lib/data"
import { ClientsList } from "./clients-list"
import { ClientDetail } from "./client-detail"

interface ClientsViewPermissions {
  canView: boolean
  canManage: boolean
}

interface ClientsViewProps {
  clients: ClientWithStats[]
  bookings: EnrichedBooking[]
  permissions: ClientsViewPermissions
}

/** Normalizes a phone string for search (digits only). */
function normalizePhone(value: string) {
  return value.replace(/\D/g, "")
}

export function ClientsView({ clients, bookings, permissions }: ClientsViewProps) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    const qDigits = normalizePhone(q)
    return clients.filter((c) => {
      const nameMatch = c.fullName.toLowerCase().includes(q)
      const phoneMatch = qDigits.length > 0 && normalizePhone(c.phone).includes(qDigits)
      return nameMatch || phoneMatch
    })
  }, [clients, query])

  const selectedClient = clients.find((c) => c.id === selectedId) ?? null

  const clientBookings = useMemo(() => {
    if (!selectedClient) return []
    return bookings
      .filter((b) => b.endClientId === selectedClient.id)
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
  }, [bookings, selectedClient])

  if (!permissions.canView) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No tenés permisos para ver los clientes.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <ClientsList
        clients={filtered}
        totalCount={clients.length}
        query={query}
        onQueryChange={setQuery}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ClientDetail client={selectedClient} bookings={clientBookings} canManage={permissions.canManage} />
    </div>
  )
}
