import { redirect } from "next/navigation"
import {
  getBusiness,
  getCurrentUser,
  getLocations,
  getModuleCatalog,
  getRoles,
  getUsers,
} from "@/lib/data"
import { can, PERMISSIONS } from "@/lib/permissions"
import { BusinessInfoForm } from "@/components/settings/business-info-form"
import { LocationsManager } from "@/components/settings/locations-manager"
import { ModulesPanel } from "@/components/settings/modules-panel"
import { CancellationPolicyForm } from "@/components/settings/cancellation-policy-form"
import { UsersRolesManager } from "@/components/settings/users-roles-manager"
import { AppearanceSettings } from "@/components/settings/appearance-settings"

export default async function ConfiguracionPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [business, modules, locations, users, roles] = await Promise.all([
    getBusiness(),
    getModuleCatalog(),
    getLocations(),
    getUsers(user.businessId),
    getRoles(user.businessId),
  ])

  const canManageSettings = can(user, PERMISSIONS.SETTINGS_MANAGE)
  const canManageLocations = can(user, PERMISSIONS.LOCATION_MANAGE)
  const canManageModules = can(user, PERMISSIONS.MODULE_MANAGE)
  // A user managing either users or roles gets the users & roles section.
  const canManageUsers = can(user, PERMISSIONS.USER_MANAGE)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Datos del negocio, sedes, módulos, políticas y apariencia del sitio público.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <BusinessInfoForm business={business} canManage={canManageSettings} />
          <LocationsManager
            businessId={business.id}
            locations={locations}
            canManage={canManageLocations}
          />
          <CancellationPolicyForm
            policy={business.cancellationPolicy}
            canManage={canManageSettings}
          />
        </div>

        <div className="flex flex-col gap-6">
          <AppearanceSettings settings={business.settings} canManage={canManageSettings} />
          {canManageModules && (
            <ModulesPanel modules={modules} enabledKeys={business.modulesEnabled} />
          )}
          {canManageUsers && <UsersRolesManager users={users} roles={roles} canManage />}
        </div>
      </div>
    </div>
  )
}
