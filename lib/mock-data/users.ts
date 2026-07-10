import type { Role, User } from "@/lib/types"
import { ALL_PERMISSIONS, STAFF_PERMISSIONS } from "@/lib/permissions"

export const MOCK_ROLES: Role[] = [
  {
    id: "role-owner",
    businessId: "biz-padel-norte",
    key: "owner",
    name: "Dueño",
    permissions: ALL_PERMISSIONS,
  },
  {
    id: "role-staff",
    businessId: "biz-padel-norte",
    key: "staff",
    name: "Recepción",
    permissions: STAFF_PERMISSIONS,
  },
]

const OWNER_ROLE = MOCK_ROLES[0]
const STAFF_ROLE = MOCK_ROLES[1]

export const MOCK_USERS: User[] = [
  {
    id: "user-owner",
    businessId: "biz-padel-norte",
    fullName: "Andrés Vidal",
    email: "andres@padelnorte.com.ar",
    role: OWNER_ROLE,
    locationIds: [], // empty = all locations
  },
  {
    id: "user-staff-centro",
    businessId: "biz-padel-norte",
    fullName: "Romina Torres",
    email: "romina@padelnorte.com.ar",
    role: STAFF_ROLE,
    locationIds: ["loc-centro"],
  },
  {
    id: "user-staff-costanera",
    businessId: "biz-padel-norte",
    fullName: "Nicolás Bravo",
    email: "nicolas@padelnorte.com.ar",
    role: STAFF_ROLE,
    locationIds: ["loc-costanera"],
  },
]

// The currently signed-in user for mocking. Swap to owner/staff to test scoping.
export const MOCK_CURRENT_USER: User = MOCK_USERS[0]
