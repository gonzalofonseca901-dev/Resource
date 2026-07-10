// Core business / venue domain types.
// These mirror the eventual Supabase tables but use camelCase column names.

export type BusinessVertical = "padel" | "studio" | "clinic" | "other"

export type BusinessTheme = "court" | "studio" | "clinic"

export interface BusinessSettings {
  theme: BusinessTheme
  accentColor: string
  logoUrl?: string
}

/**
 * Cancellation rules that govern how far in advance an end client may cancel
 * without penalty, and what penalty applies otherwise. Consumed by the bot and
 * the public site; editable from the Configuración screen.
 */
export interface CancellationPolicy {
  // Minimum hours before the slot a client can cancel with no charge.
  minHoursBeforeStart: number
  // Fraction (0–1) of the booking price charged for a late cancellation.
  lateCancellationFeePercent: number
  // Whether a no-show is charged the full price automatically.
  chargeNoShow: boolean
  // Free-text note surfaced to clients (Rioplatense Spanish).
  policyNote: string
}

export interface Business {
  id: string
  slug: string
  name: string
  vertical: BusinessVertical
  // Contact / fiscal data shown in Configuración and on the public site.
  legalName: string
  taxId: string
  email: string
  phone: string
  modulesEnabled: string[]
  cancellationPolicy: CancellationPolicy
  settings: BusinessSettings
}

/** A toggleable product module. The catalog is static; `modulesEnabled` on the
 * business decides which are active. */
export interface ModuleDefinition {
  key: string
  name: string
  description: string
  // Modules the platform requires to always stay on.
  required?: boolean
}

export interface Location {
  id: string
  businessId: string
  name: string
  address: string
  city: string
  phone: string
  whatsappNumber: string
  timezone: string
  isActive: boolean
}

export type ResourceType = "court" | "room" | "seat" | "table" | "other"

export interface Resource {
  id: string
  locationId: string
  businessId: string
  name: string
  type: ResourceType
  description: string
  // Max simultaneous end clients the resource holds (e.g. players on a court).
  capacity: number
  isActive: boolean
}

// Day of week: 0 = Sunday ... 6 = Saturday (JS getDay convention).
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Schedule {
  id: string
  resourceId: string
  dayOfWeek: DayOfWeek
  // "HH:mm" 24h local time.
  openTime: string
  closeTime: string
  slotDurationMin: number
  isActive: boolean
}

export type PricingRuleType = "base" | "day_of_week" | "time_range" | "specific_date"

export type Currency = "ARS" | "USD" | "EUR"

export interface ResourcePricing {
  id: string
  resourceId: string
  ruleType: PricingRuleType
  dayOfWeek?: DayOfWeek
  // "HH:mm" bounds for time_range rules.
  fromTime?: string
  toTime?: string
  // "YYYY-MM-DD" for specific_date rules.
  specificDate?: string
  price: number
  currency: Currency
  // Higher priority wins when multiple rules match a slot.
  priority: number
}

export interface ScheduleBlock {
  id: string
  resourceId: string
  // ISO 8601 timestamps.
  startsAt: string
  endsAt: string
  reason: string
}
