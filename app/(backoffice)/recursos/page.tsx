import { redirect } from "next/navigation"
import {
  getCurrentUser,
  getLocationsForUser,
  getManagedResourcesByLocations,
  getPricingByResources,
  getScheduleBlocksByResources,
  getSchedulesByResources,
} from "@/lib/data"
import { can, PERMISSIONS } from "@/lib/permissions"
import { ResourcesView } from "@/components/resources/resources-view"

export default async function RecursosPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const resources = await getManagedResourcesByLocations(locationIds)

  const resourceIds = resources.map((r) => r.id)

  // 3 queries batched en total (una por tipo), en vez de 3 por recurso.
  const [schedulesByResource, pricingByResource, blocksByResource] = await Promise.all([
    getSchedulesByResources(resourceIds),
    getPricingByResources(resourceIds),
    getScheduleBlocksByResources(resourceIds),
  ])

  const permissions = {
    canView: can(user, PERMISSIONS.RESOURCE_VIEW),
    canManage: can(user, PERMISSIONS.RESOURCE_MANAGE),
    canManageSchedules: can(user, PERMISSIONS.SCHEDULE_MANAGE),
    canManagePricing: can(user, PERMISSIONS.PRICING_MANAGE),
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Recursos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá canchas, consultorios o sillones: datos, horarios de atención y precios
          variables por franja.
        </p>
      </div>

      <ResourcesView
        resources={resources}
        locations={locations}
        schedulesByResource={schedulesByResource}
        pricingByResource={pricingByResource}
        blocksByResource={blocksByResource}
        permissions={permissions}
      />
    </div>
  )
}
