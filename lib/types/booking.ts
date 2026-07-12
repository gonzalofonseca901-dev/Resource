// Client + booking domain types.

import type { Currency, DayOfWeek } from "./business"

export type PreferredChannel = "whatsapp" | "web" | "phone"

export interface EndClient {
  id: string
  businessId: string
  fullName: string
  phone: string
  email?: string
  loyaltyPoints: number
  preferredChannel: PreferredChannel
}

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no_show"

export type BookingSource = "whatsapp_bot" | "web" | "backoffice_manual"

export type PaymentStatus = "pending" | "partial" | "paid" | "cancelled"

export interface Booking {
  id: string
  resourceId: string
  locationId: string
  endClientId: string
  // ISO 8601 timestamps.
  startsAt: string
  endsAt: string
  status: BookingStatus
  source: BookingSource
  price: number
  paymentStatus: PaymentStatus
}

export type RecurringBookingStatus = "active" | "paused" | "cancelled"

export interface RecurringBooking {
  id: string
  resourceId: string
  endClientId: string
  dayOfWeek: DayOfWeek
  // "HH:mm" local time.
  startTime: string
  endTime: string
  // "YYYY-MM-DD" range.
  validFrom: string
  validUntil?: string
  status: RecurringBookingStatus
  price: number
  currency?: Currency
}
