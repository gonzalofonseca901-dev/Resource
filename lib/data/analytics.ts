// Analytics aggregation. ALL metric/business logic lives here so the UI only
// renders computed AnalyticsMetrics. Mirrors what would later be Postgres
// aggregate queries / a materialized view over bookings.

import type { DayOfWeek, User } from "@/lib/types"
import { getLocationsForUser } from "./locations"
import { getManagedResourcesByLocations } from "./resources"
import { getBookings } from "./bookings"
import type {
  AnalyticsMetrics,
  AnalyticsPairPoint,
  AnalyticsPoint,
  EnrichedBooking,
} from "./types"

// Monday-first weekday labels (Rioplatense Spanish, short).
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const WEEKDAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

// Statuses that represent a slot actually consumed (for occupancy/revenue).
const CONSUMED = new Set(["confirmed", "completed", "pending", "no_show"])
// Statuses that count toward realized/expected revenue.
const REVENUE_STATUSES = new Set(["confirmed", "completed", "pending"])

/** Index 0..6 (Mon..Sun) for a JS getDay() value. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function emptyWeekdayBuckets(): number[] {
  return [0, 0, 0, 0, 0, 0, 0]
}

/**
 * Analytics for the given user's accessible locations. `revenue` is always
 * computed here; the page decides whether to forward it to the UI based on the
 * analytics.view_financials permission.
 */
export async function getAnalyticsMetrics(user: User): Promise<AnalyticsMetrics> {
  const locations = await getLocationsForUser(user)
  const locationIds = locations.map((l) => l.id)

  const [resources, bookings] = await Promise.all([
    getManagedResourcesByLocations(locationIds),
    getBookings(locationIds),
  ])

  const activeResources = resources.filter((r) => r.isActive)

  // --- Occupancy -----------------------------------------------------------
  // Modelled capacity: each active resource offers ~8 sellable slots/day, so a
  // rolling 14-day window gives a realistic denominator against mock volume.
  const DAYS_IN_PERIOD = 14
  const SLOTS_PER_DAY = 8
  const availableSlots = activeResources.length * SLOTS_PER_DAY * DAYS_IN_PERIOD

  const consumed = bookings.filter((b) => CONSUMED.has(b.status))
  const bookedSlots = consumed.length

  const occByWeekday = emptyWeekdayBuckets()
  for (const b of consumed) {
    occByWeekday[weekdayIndex(new Date(b.startsAt))] += 1
  }
  const occupancyDenomPerDay = Math.max(activeResources.length * SLOTS_PER_DAY, 1)
  const byWeekday: AnalyticsPoint[] = WEEKDAY_ORDER.map((_, i) => ({
    label: WEEKDAY_LABELS[i],
    value: Math.min(1, occByWeekday[i] / (occupancyDenomPerDay * 2)),
  }))

  const byResource: AnalyticsPairPoint[] = activeResources.map((r) => {
    const booked = consumed.filter((b) => b.resourceId === r.id).length
    const capacity = SLOTS_PER_DAY * DAYS_IN_PERIOD
    return { label: r.name, primary: booked, secondary: Math.max(capacity - booked, 0) }
  })

  const occupancy = {
    rate: availableSlots > 0 ? bookedSlots / availableSlots : 0,
    bookedSlots,
    availableSlots,
    byWeekday,
    byResource,
  }

  // --- No-shows ------------------------------------------------------------
  const noShows = bookings.filter((b) => b.status === "no_show")
  const nsByWeekday = emptyWeekdayBuckets()
  for (const b of noShows) {
    nsByWeekday[weekdayIndex(new Date(b.startsAt))] += 1
  }
  const noShow = {
    count: noShows.length,
    totalBookings: consumed.length,
    rate: consumed.length > 0 ? noShows.length / consumed.length : 0,
    byWeekday: WEEKDAY_ORDER.map((_, i) => ({
      label: WEEKDAY_LABELS[i],
      value: nsByWeekday[i],
    })),
  }

  // --- Retention -----------------------------------------------------------
  const bookingsByClient = new Map<string, number>()
  for (const b of bookings) {
    if (b.status === "cancelled") continue
    bookingsByClient.set(b.endClientId, (bookingsByClient.get(b.endClientId) ?? 0) + 1)
  }
  const totalClients = bookingsByClient.size
  let returningClients = 0
  const distBuckets = { one: 0, two: 0, threeToFour: 0, fivePlus: 0 }
  for (const count of bookingsByClient.values()) {
    if (count >= 2) returningClients += 1
    if (count === 1) distBuckets.one += 1
    else if (count === 2) distBuckets.two += 1
    else if (count <= 4) distBuckets.threeToFour += 1
    else distBuckets.fivePlus += 1
  }
  const retention = {
    totalClients,
    returningClients,
    newClients: totalClients - returningClients,
    rate: totalClients > 0 ? returningClients / totalClients : 0,
    distribution: [
      { label: "1 reserva", value: distBuckets.one },
      { label: "2 reservas", value: distBuckets.two },
      { label: "3-4 reservas", value: distBuckets.threeToFour },
      { label: "5+ reservas", value: distBuckets.fivePlus },
    ],
  }

  // --- Revenue (gated at the page) ----------------------------------------
  const revenueBookings = bookings.filter((b) => REVENUE_STATUSES.has(b.status))
  const total = revenueBookings.reduce((sum, b) => sum + b.price, 0)
  const collected = revenueBookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.price, 0)
  const partial = revenueBookings
    .filter((b) => b.paymentStatus === "partial")
    .reduce((sum, b) => sum + b.price, 0)

  const revByWeekday = emptyWeekdayBuckets()
  for (const b of revenueBookings) {
    revByWeekday[weekdayIndex(new Date(b.startsAt))] += b.price
  }

  const revByResourceMap = new Map<string, number>()
  for (const b of revenueBookings) {
    revByResourceMap.set(b.resourceId, (revByResourceMap.get(b.resourceId) ?? 0) + b.price)
  }

  const revenue = {
    total,
    averagePerBooking:
      revenueBookings.length > 0 ? Math.round(total / revenueBookings.length) : 0,
    // Collected = fully paid + half of partial (seña), rounded.
    collected: Math.round(collected + partial * 0.5),
    outstanding: Math.round(total - collected - partial * 0.5),
    byWeekday: WEEKDAY_ORDER.map((_, i) => ({
      label: WEEKDAY_LABELS[i],
      value: revByWeekday[i],
    })),
    byResource: activeResources
      .map((r) => ({ label: r.name, value: revByResourceMap.get(r.id) ?? 0 }))
      .filter((p) => p.value > 0),
  }

  return {
    periodLabel: "Últimas 2 semanas",
    occupancy,
    noShow,
    retention,
    revenue,
  }
}

/** Re-export for callers that only need the enriched booking shape. */
export type { EnrichedBooking }
