// Internal staff / roles domain types.

export type RoleKey = "owner" | "staff"

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
}
