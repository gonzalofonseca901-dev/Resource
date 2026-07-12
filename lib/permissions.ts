// Centralized permission definitions and the `can` guard.
// Components must never check permission strings inline — always go through `can`
// with a key from PERMISSIONS so the swap to a real auth backend is a one-file change.
//
// Las keys son las reales del catálogo `permissions` (migración 003), formato
// "<recurso>.<accion>" con `module_key` asociado. Antes acá había keys inventadas
// por v0 ("booking:view" con `:`) que no existían en la base — las alineé.
//
// SUPUESTO: las acciones de "ver" (recursos, sedes) NO están gateadas por permission
// en el catálogo real — el scoping de qué ve cada usuario lo resuelve RLS +
// user_location_access/user_resource_access, no un permission explícito. Si en algún
// momento eso cambia, agregar la key acá y en el catálogo de 003 (no es breaking:
// simplemente hoy VIEW checks devuelven true para cualquier usuario autenticado del
// negocio, filtrado después por RLS a nivel de fila).

import type { User } from "./types/auth"

export const PERMISSIONS = {
  // Bookings — módulo "bookings" (core)
  BOOKING_VIEW: "bookings.view",
  BOOKING_CREATE: "bookings.create",
  BOOKING_UPDATE: "bookings.edit",
  BOOKING_CANCEL: "bookings.cancel",

  // Recursos / horarios / precios — todo bajo el mismo permission en el catálogo real
  // RESOURCE_VIEW es sintético (no existe en el catálogo `permissions` de la DB):
  // ver recursos no está gateado por permission, solo por scoping de sede/recurso.
  // session.ts se lo agrega siempre a cualquier usuario autenticado del negocio.
  RESOURCE_VIEW: "resources.view",
  RESOURCE_MANAGE: "core.manage_resources_config",
  SCHEDULE_MANAGE: "core.manage_resources_config",
  PRICING_MANAGE: "core.manage_resources_config",

  // Turnos fijos — módulo "recurring" (activable)
  RECURRING_MANAGE: "recurring.manage",

  // Clientes
  CLIENT_VIEW: "clients.view",
  CLIENT_MANAGE: "clients.manage",

  // Sedes
  LOCATION_MANAGE: "core.manage_locations",

  // Staff, roles, negocio
  USER_MANAGE: "core.manage_users",
  ROLE_MANAGE: "core.manage_roles",
  SETTINGS_MANAGE: "core.manage_business_settings",
  CANCELLATION_POLICY_MANAGE: "core.manage_cancellation_policies",
  MODULE_MANAGE: "core.manage_modules",
  AUDIT_LOG_VIEW: "core.view_audit_log",

  // Analytics — separado operacional vs financiero a propósito (ver context pack)
  REPORT_VIEW: "analytics.view_operational",
  ANALYTICS_VIEW_FINANCIALS: "analytics.view_financials",
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Convenience: every permission an owner should have.
export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS)

// Default permission set para el seed role "staff" (ver 003, sección 5).
// Debe reflejar lo mismo que `default_role_permissions` para el rol staff en la DB —
// si los editás por separado, se van a desincronizar en el mock/fallback.
export const STAFF_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.BOOKING_VIEW,
  PERMISSIONS.BOOKING_CREATE,
  PERMISSIONS.BOOKING_UPDATE,
  PERMISSIONS.BOOKING_CANCEL,
  PERMISSIONS.RECURRING_MANAGE,
  PERMISSIONS.CLIENT_VIEW,
  PERMISSIONS.CLIENT_MANAGE,
  PERMISSIONS.REPORT_VIEW,
  // payments.view / pos.operate existen en el catálogo real (003) pero no
  // hay pantalla en el frontend todavía que los use — no se agregan acá
  // hasta que haya un módulo de pagos/POS real.
]

/**
 * Returns whether the given user is granted a permission.
 *
 * Signature is intentionally stable so it can later wrap a real session/role
 * lookup without touching call sites. Con datos reales, `user.role.permissions`
 * viene de `auth_has_permission()` resuelto server-side (ver lib/data/session.ts),
 * que ya tiene en cuenta module gating y overrides por usuario — acá no se
 * vuelve a evaluar nada de eso, solo se chequea membership en el array.
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
