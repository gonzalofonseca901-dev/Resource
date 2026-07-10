import { getBookings, getClients, getCurrentUser, getLocationsForUser } from "@/lib/data"
import { can, PERMISSIONS } from "@/lib/permissions"
import { ClientsView } from "@/components/clients/clients-view"

export default async function ClientesPage() {
  const user = await getCurrentUser()
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const [clients, bookings] = await Promise.all([
    getClients(user.businessId),
    getBookings(locationIds),
  ])

  const permissions = {
    canView: can(user, PERMISSIONS.CLIENT_VIEW),
    canManage: can(user, PERMISSIONS.CLIENT_MANAGE),
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Buscá clientes por nombre o teléfono y revisá su historial de reservas.
        </p>
      </div>

      <ClientsView clients={clients} bookings={bookings} permissions={permissions} />
    </div>
  )
}
