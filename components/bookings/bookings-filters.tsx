"use client"

import { useMemo } from "react"
import { X } from "lucide-react"
import type { BookingStatus, Location, Resource } from "@/lib/types"
import { ALL, type BookingFilters } from "@/lib/booking-filters"
import { STATUS_META } from "@/lib/booking-display"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const STATUS_ORDER: BookingStatus[] = [
  "confirmed",
  "pending",
  "completed",
  "no_show",
  "cancelled",
]

interface BookingsFiltersProps {
  locations: Location[]
  resources: Resource[]
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
  onClear: () => void
  canClear: boolean
}

export function BookingsFilters({
  locations,
  resources,
  filters,
  onChange,
  onClear,
  canClear,
}: BookingsFiltersProps) {
  // When a location is selected, the resource list narrows to that location.
  const resourceOptions = useMemo(() => {
    if (filters.locationId === ALL) return resources
    return resources.filter((r) => r.locationId === filters.locationId)
  }, [resources, filters.locationId])

  function set<K extends keyof BookingFilters>(key: K, value: BookingFilters[K]) {
    const next = { ...filters, [key]: value }
    // Reset resource when it no longer belongs to the chosen location.
    if (key === "locationId") next.resourceId = ALL
    onChange(next)
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:max-w-3xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {locations.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-location">Sede</Label>
            <Select
              id="filter-location"
              value={filters.locationId}
              onChange={(e) => set("locationId", e.target.value)}
            >
              <option value={ALL}>Todas</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-resource">Cancha</Label>
          <Select
            id="filter-resource"
            value={filters.resourceId}
            onChange={(e) => set("resourceId", e.target.value)}
          >
            <option value={ALL}>Todas</option>
            {resourceOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-status">Estado</Label>
          <Select
            id="filter-status"
            value={filters.status}
            onChange={(e) => set("status", e.target.value as BookingFilters["status"])}
          >
            <option value={ALL}>Todos</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-from">Desde</Label>
          <Input
            id="filter-from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => set("from", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-to">Hasta</Label>
          <Input
            id="filter-to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => set("to", e.target.value)}
          />
        </div>
      </div>

      {canClear && (
        <div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="size-3.5" aria-hidden="true" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
