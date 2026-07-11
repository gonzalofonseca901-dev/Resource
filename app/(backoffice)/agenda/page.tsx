import { redirect } from "next/navigation"
import {
  getBookingsByDateRange,
  getCurrentUser,
  getLocationsForUser,
  getResourcesByLocations,
} from "@/lib/data"
import { addDays, startOfWeek } from "@/lib/date-utils"
import { AgendaView } from "@/components/agenda/agenda-view"

export default async function AgendaPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  // Load the current and next week so week navigation has data on hand.
  const rangeStart = startOfWeek(new Date())
  const rangeEnd = addDays(rangeStart, 14)

  const [resources, bookings] = await Promise.all([
    getResourcesByLocations(locationIds),
    getBookingsByDateRange(locationIds, rangeStart, rangeEnd),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Reservas por cancha. Elegí el día y la sede para ver el detalle.
        </p>
      </div>

      <AgendaView
        locations={locations}
        resources={resources}
        bookings={bookings}
        initialDayISO={new Date().toISOString()}
      />
    </div>
  )
}
