// Staff + role fetchers, implementación real.

import type { Role, User } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

/** All roles defined for a business, with their granted permission keys. */
export async function getRoles(businessId: string): Promise<Role[]> {
  const supabase = await createClient()

  const [{ data: roles, error: rolesError }, { data: rolePerms, error: permsError }] =
    await Promise.all([
      supabase.from("roles").select("id, business_id, key, name").eq("business_id", businessId),
      supabase
        .from("role_permissions")
        .select("role_id, permission_key, roles!inner(business_id)")
        .eq("roles.business_id", businessId),
    ])

  if (rolesError) throw new Error(`No se pudieron cargar los roles: ${rolesError.message}`)
  if (permsError) throw new Error(`No se pudieron cargar los permisos: ${permsError.message}`)

  const permsByRole = new Map<string, string[]>()
  for (const rp of rolePerms ?? []) {
    const list = permsByRole.get(rp.role_id) ?? []
    list.push(rp.permission_key)
    permsByRole.set(rp.role_id, list)
  }

  return (roles ?? []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    key: r.key,
    name: r.name,
    permissions: [...(permsByRole.get(r.id) ?? []), "resources.view"],
  }))
}

/** All staff members for a business, owners first then alphabetical. */
export async function getUsers(businessId: string): Promise<User[]> {
  const supabase = await createClient()

  const [
    { data: users, error: usersError },
    roles,
    { data: locationAccess, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, business_id, full_name, email, role_id, is_agency_admin, roles(id, key, name)")
      .eq("business_id", businessId),
    getRoles(businessId),
    supabase
      .from("user_location_access")
      .select("user_id, location_id, users!inner(business_id)")
      .eq("users.business_id", businessId),
  ])

  if (usersError) throw new Error(`No se pudieron cargar los usuarios: ${usersError.message}`)
  if (locationsError)
    throw new Error(`No se pudo cargar el scoping de sedes: ${locationsError.message}`)

  const rolesById = new Map(roles.map((r) => [r.id, r]))

  const locationsByUser = new Map<string, string[]>()
  for (const la of locationAccess ?? []) {
    const list = locationsByUser.get(la.user_id) ?? []
    list.push(la.location_id)
    locationsByUser.set(la.user_id, list)
  }

  return (users ?? [])
    .map((u): User | null => {
      const role = rolesById.get(u.role_id)
      if (!role) return null
      return {
        id: u.id,
        businessId: u.business_id,
        fullName: u.full_name,
        email: u.email,
        role,
        locationIds: locationsByUser.get(u.id) ?? [],
        isAgencyAdmin: u.is_agency_admin ?? false,
      }
    })
    .filter((u): u is User => u !== null)
    .sort((a, b) => {
      if (a.role.key !== b.role.key) return a.role.key === "owner" ? -1 : 1
      return a.fullName.localeCompare(b.fullName)
    })
}
