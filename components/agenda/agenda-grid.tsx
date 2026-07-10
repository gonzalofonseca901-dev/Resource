import { CalendarDays } from "lucide-react"
import type { EnrichedBooking } from "@/lib/data"
import type { Location, Resource } from "@/lib/types"
import { TimeAxis } from "./time-axis"
import { ResourceColumn } from "./resource-column"

interface AgendaGridProps {
  resources: Resource[]
  bookingsByResource: Record<string, EnrichedBooking[]>
  locationsById: Record<string, Location>
  showLocation: boolean
}

export function AgendaGrid({
  resources,
  bookingsByResource,
  locationsById,
  showLocation,
}: AgendaGridProps) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card py-16 text-center">
        <CalendarDays className="size-7 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No hay canchas para mostrar con este filtro.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      <div className="flex max-h-[70vh] min-w-max">
        <TimeAxis />
        {resources.map((resource) => (
          <ResourceColumn
            key={resource.id}
            resource={resource}
            locationName={locationsById[resource.locationId]?.name ?? ""}
            bookings={bookingsByResource[resource.id] ?? []}
            showLocation={showLocation}
          />
        ))}
      </div>
    </div>
  )
}
