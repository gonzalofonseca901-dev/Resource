import {
  getBookings,
  getClients,
  getCurrentUser,
  getLocationsForUser,
  getResourcesByLocations,
} from "@/lib/data"
import { can, PERMISSIONS } from "@/lib/permissions"
import { BookingsView } from "@/components/bookings/bookings-view"

export default async function ReservasPage() {
  const user = await getCurrentUser()
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const [bookings, resources, clients] = await Promise.all([
    getBookings(locationIds),
    getResourcesByLocations(locationIds),
    getClients(user.businessId),
  ])

  const permissions = {
    canCreate: can(user, PERMISSIONS.BOOKING_CREATE),
    canEdit: can(user, PERMISSIONS.BOOKING_UPDATE),
    canCancel: can(user, PERMISSIONS.BOOKING_CANCEL),
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Reservas</h1>
        <p className="text-sm text-muted-foreground">
          Listado de reservas. Filtrá por sede, cancha, estado o fecha, y gestioná cada turno.
        </p>
      </div>

      <BookingsView
        bookings={bookings}
        locations={locations}
        resources={resources}
        clients={clients}
        permissions={permissions}
      />
    </div>
  )
}
