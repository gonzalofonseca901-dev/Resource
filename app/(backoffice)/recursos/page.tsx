import {
  getCurrentUser,
  getLocationsForUser,
  getManagedResourcesByLocations,
  getPricingByResource,
  getScheduleBlocksByResource,
  getSchedulesByResource,
} from "@/lib/data"
import type { ResourcePricing, Schedule, ScheduleBlock } from "@/lib/types"
import { can, PERMISSIONS } from "@/lib/permissions"
import { ResourcesView } from "@/components/resources/resources-view"

export default async function RecursosPage() {
  const user = await getCurrentUser()
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const resources = await getManagedResourcesByLocations(locationIds)

  // Pre-fetch schedules, pricing and blocks for every resource so the client
  // view can switch between resources without further round-trips. With a real
  // backend this becomes a single select with nested relations.
  const [schedulesList, pricingList, blocksList] = await Promise.all([
    Promise.all(resources.map((r) => getSchedulesByResource(r.id))),
    Promise.all(resources.map((r) => getPricingByResource(r.id))),
    Promise.all(resources.map((r) => getScheduleBlocksByResource(r.id))),
  ])

  const schedulesByResource: Record<string, Schedule[]> = {}
  const pricingByResource: Record<string, ResourcePricing[]> = {}
  const blocksByResource: Record<string, ScheduleBlock[]> = {}
  resources.forEach((r, i) => {
    schedulesByResource[r.id] = schedulesList[i]
    pricingByResource[r.id] = pricingList[i]
    blocksByResource[r.id] = blocksList[i]
  })

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
