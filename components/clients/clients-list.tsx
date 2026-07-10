"use client"

import { Search, Users, ChevronRight } from "lucide-react"
import type { ClientWithStats } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface ClientsListProps {
  clients: ClientWithStats[]
  totalCount: number
  query: string
  onQueryChange: (value: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ClientsList({
  clients,
  totalCount,
  query,
  onQueryChange,
  selectedId,
  onSelect,
}: ClientsListProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            aria-label="Buscar clientes"
            className="pl-9"
          />
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          {clients.length} de {totalCount} cliente{totalCount === 1 ? "" : "s"}
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Users className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">Sin resultados</p>
          <p className="text-sm text-muted-foreground">
            Ningún cliente coincide con la búsqueda.
          </p>
        </div>
      ) : (
        <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
          {clients.map((client) => {
            const isSelected = client.id === selectedId
            return (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => onSelect(client.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                    isSelected && "bg-secondary",
                  )}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                    aria-hidden="true"
                  >
                    {getInitials(client.fullName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{client.fullName}</span>
                    <span className="block truncate font-mono text-xs text-muted-foreground tabular-nums">
                      {client.phone}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-medium tabular-nums">
                      {client.totalBookings}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                      reservas
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
