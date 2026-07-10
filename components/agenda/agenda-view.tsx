"use client"

import { useMemo, useState } from "react"
import type { EnrichedBooking } from "@/lib/data"
import type { Location, Resource } from "@/lib/types"
import { addDays, isSameDay, startOfWeek } from "@/lib/date-utils"
import { LocationFilter, ALL_LOCATIONS } from "./location-filter"
import { WeekNavigator } from "./week-navigator"
import { DayTabs } from "./day-tabs"
import { AgendaGrid } from "./agenda-grid"
import { StatusLegend } from "./status-legend"

interface AgendaViewProps {
  // Only locations the current user is allowed to see.
  locations: Location[]
  resources: Resource[]
  bookings: EnrichedBooking[]
  initialDayISO: string
}

export function AgendaView({
  locations,
  resources,
  bookings,
  initialDayISO,
}: AgendaViewProps) {
  const initialDay = useMemo(() => new Date(initialDayISO), [initialDayISO])
  const [selectedDay, setSelectedDay] = useState<Date>(initialDay)
  const [locationId, setLocationId] = useState<string>(ALL_LOCATIONS)

  const weekStart = useMemo(() => startOfWeek(selectedDay), [selectedDay])

  const locationsById = useMemo(() => {
    return Object.fromEntries(locations.map((l) => [l.id, l])) as Record<string, Location>
  }, [locations])

  // Resources visible under the current location filter.
  const visibleResources = useMemo(() => {
    if (locationId === ALL_LOCATIONS) return resources
    return resources.filter((r) => r.locationId === locationId)
  }, [resources, locationId])

  const showLocation = locationId === ALL_LOCATIONS && locations.length > 1

  // Bookings for the selected day, grouped by resource, honoring the filter.
  const bookingsByResource = useMemo(() => {
    const visibleIds = new Set(visibleResources.map((r) => r.id))
    const grouped: Record<string, EnrichedBooking[]> = {}
    for (const booking of bookings) {
      if (!visibleIds.has(booking.resourceId)) continue
      if (!isSameDay(new Date(booking.startsAt), selectedDay)) continue
      ;(grouped[booking.resourceId] ??= []).push(booking)
    }
    return grouped
  }, [bookings, visibleResources, selectedDay])

  function shiftWeek(deltaDays: number) {
    setSelectedDay((prev) => addDays(prev, deltaDays))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <WeekNavigator
          weekStart={weekStart}
          onPrev={() => shiftWeek(-7)}
          onNext={() => shiftWeek(7)}
          onToday={() => setSelectedDay(new Date())}
        />
        <LocationFilter
          locations={locations}
          value={locationId}
          onChange={setLocationId}
        />
      </div>

      <DayTabs weekStart={weekStart} selectedDay={selectedDay} onSelect={setSelectedDay} />

      <AgendaGrid
        resources={visibleResources}
        bookingsByResource={bookingsByResource}
        locationsById={locationsById}
        showLocation={showLocation}
      />

      <StatusLegend />
    </div>
  )
}
