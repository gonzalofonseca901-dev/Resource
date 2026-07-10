// Centralized permission definitions and the `can` guard.
// Components must never check permission strings inline — always go through `can`
// with a key from PERMISSIONS so the swap to a real auth backend is a one-file change.

import type { User } from "./types/auth"

export const PERMISSIONS = {
  // Bookings
  BOOKING_VIEW: "booking:view",
  BOOKING_CREATE: "booking:create",
  BOOKING_UPDATE: "booking:update",
  BOOKING_CANCEL: "booking:cancel",
  // Resources
  RESOURCE_VIEW: "resource:view",
  RESOURCE_MANAGE: "resource:manage",
  // Schedules & pricing
  SCHEDULE_MANAGE: "schedule:manage",
  PRICING_MANAGE: "pricing:manage",
  // Clients
  CLIENT_VIEW: "client:view",
  CLIENT_MANAGE: "client:manage",
  // Locations
  LOCATION_VIEW: "location:view",
  LOCATION_MANAGE: "location:manage",
  // Staff & roles (core.manage_roles)
  USER_MANAGE: "user:manage",
  // Business settings
  SETTINGS_MANAGE: "settings:manage",
  // Active modules toggle (core.manage_modules)
  MODULE_MANAGE: "module:manage",
  // Reports / analytics
  REPORT_VIEW: "report:view",
  // Revenue & financial breakdowns inside analytics (analytics.view_financials)
  ANALYTICS_VIEW_FINANCIALS: "analytics:view_financials",
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Convenience: every permission an owner should have.
export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS)

// Default permission set for a staff member (day-to-day front desk operations).
export const STAFF_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.BOOKING_VIEW,
  PERMISSIONS.BOOKING_CREATE,
  PERMISSIONS.BOOKING_UPDATE,
  PERMISSIONS.BOOKING_CANCEL,
  PERMISSIONS.RESOURCE_VIEW,
  PERMISSIONS.CLIENT_VIEW,
  PERMISSIONS.CLIENT_MANAGE,
  PERMISSIONS.LOCATION_VIEW,
  // Staff can open analytics and see operational metrics (occupancy, no-shows,
  // retention) but NOT the revenue/financial breakdown, and NOT modules/roles.
  PERMISSIONS.REPORT_VIEW,
]

/**
 * Returns whether the given user is granted a permission.
 *
 * Signature is intentionally stable so it can later wrap a real session/role
 * lookup without touching call sites.
 */
export function can(user: User | null | undefined, permission: PermissionKey): boolean {
  if (!user) return false
  return user.role.permissions.includes(permission)
}

/**
 * Whether a user can access a given location.
 * Empty locationIds means the user has access to every location in the business.
 */
export function canAccessLocation(user: User | null | undefined, locationId: string): boolean {
  if (!user) return false
  if (user.locationIds.length === 0) return true
  return user.locationIds.includes(locationId)
}
