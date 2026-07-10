// Staff + role fetchers. Mirror Supabase selects on `users`/`roles` scoped to
// the current business (`.eq('business_id', businessId)`).

import type { Role, User } from "@/lib/types"
import { MOCK_ROLES, MOCK_USERS } from "@/lib/mock-data"

/** All staff members for a business, owners first then alphabetical. */
export async function getUsers(businessId: string): Promise<User[]> {
  return MOCK_USERS.filter((u) => u.businessId === businessId).sort((a, b) => {
    if (a.role.key !== b.role.key) return a.role.key === "owner" ? -1 : 1
    return a.fullName.localeCompare(b.fullName)
  })
}

/** All roles defined for a business. */
export async function getRoles(businessId: string): Promise<Role[]> {
  return MOCK_ROLES.filter((r) => r.businessId === businessId)
}
