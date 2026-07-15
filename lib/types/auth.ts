// Internal staff / roles domain types.

// Roles son customizables por negocio (ver migración 003) — no un enum fijo.
// "owner" y "staff" son las seed keys, pero cualquier negocio puede tener más.
export type RoleKey = string

export interface Role {
  id: string
  businessId: string
  key: RoleKey
  name: string
  // Permission keys granted to this role. See lib/permissions.ts for the canonical list.
  permissions: string[]
}

export interface User {
  id: string
  businessId: string
  fullName: string
  email: string
  role: Role
  // Location ids this user can access. Empty array = access to all locations.
  locationIds: string[]
  // Panel de agencia (Sprint 6) — public.users.is_agency_admin. No es un
  // permission del catálogo de `permissions` (003): es un flag aparte,
  // ortogonal al RBAC por negocio, que habilita el route group app/(admin).
  isAgencyAdmin: boolean
}
