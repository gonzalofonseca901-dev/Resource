// Dashboard aggregation. All metric/business logic lives here (never in the UI)
// so components only render the computed DashboardMetrics.

import type { User } from "@/lib/types"
import { addDays, startOfDay } from "@/lib/date-utils"
import { getLocationsForUser } from "./locations"
import { getBookingsByDateRange } from "./bookings"
import type { DashboardMetrics } from "./types"

// Revenue only counts bookings that will actually generate income.
const REVENUE_STATUSES = new Set(["confirmed", "completed", "pending"])

/**
 * Metrics for the given user's accessible locations on a specific day
 * (defaults to today).
 */
export async function getDashboardMetrics(
  user: User,
  reference: Date = new Date(),
): Promise<DashboardMetrics> {
  const dayStart = startOfDay(reference)
  const dayEnd = addDays(dayStart, 1)

  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const todaysBookings = await getBookingsByDateRange(locationIds, dayStart, dayEnd)
  const active = todaysBookings.filter((b) => b.status !== "cancelled")

  const now = reference.getTime()

  return {
    date: dayStart.toISOString().slice(0, 10),
    bookingsToday: active.length,
    confirmedToday: active.filter((b) => b.status === "confirmed").length,
    pendingToday: active.filter((b) => b.status === "pending").length,
    estimatedRevenueToday: active
      .filter((b) => REVENUE_STATUSES.has(b.status))
      .reduce((sum, b) => sum + b.price, 0),
    upcomingToday: active
      .filter(
        (b) =>
          (b.status === "confirmed" || b.status === "pending") &&
          new Date(b.startsAt).getTime() >= now,
      )
      .slice(0, 6),
    noShowAlerts: todaysBookings.filter((b) => b.status === "no_show"),
    unpaidAlerts: active.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "completed") &&
        (b.paymentStatus === "pending" || b.paymentStatus === "partial"),
    ),
  }
}
