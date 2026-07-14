import { redirect } from "next/navigation"
import {
  getClients,
  getCurrentUser,
  getExceptionsBySeries,
  getLocationsForUser,
  getRecurringBookings,
  getResourcesByLocations,
} from "@/lib/data"
import { can, PERMISSIONS } from "@/lib/permissions"
import { RecurringView } from "@/components/recurring/recurring-view"

export default async function TurnosFijosPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const [series, resources, clients] = await Promise.all([
    getRecurringBookings(locationIds),
    getResourcesByLocations(locationIds),
    getClients(user.businessId),
  ])

  const exceptions = await getExceptionsBySeries(series.map((s) => s.id))

  const permissions = {
    canCreate: can(user, PERMISSIONS.RECURRING_MANAGE),
    canCancel: can(user, PERMISSIONS.RECURRING_MANAGE),
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Turnos fijos</h1>
        <p className="text-sm text-muted-foreground">
          Series recurrentes que se repiten cada semana. Podés dar de baja una serie completa
          o cancelar una fecha puntual.
        </p>
      </div>

      <RecurringView
        series={series}
        locations={locations}
        resources={resources}
        clients={clients}
        permissions={permissions}
        initialExceptions={exceptions}
      />
    </div>
  )
}
