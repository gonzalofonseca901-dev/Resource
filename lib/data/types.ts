// Shapes returned by the data layer. These mirror what Supabase returns for
// selects with embedded relations (e.g.
// `.select('*, client:end_clients(*), resource:resources(*), location:locations(*)')`),
// so components can consume them unchanged once the fetchers hit a real backend.

import type {
  Booking,
  EndClient,
  Location,
  RecurringBooking,
  Resource,
} from "@/lib/types"

/** A booking joined with its client, resource and location. */
export interface EnrichedBooking extends Booking {
  client: EndClient
  resource: Resource
  location: Location
}

/**
 * A recurring series joined with its client, resource and location.
 * The location is resolved through the resource (recurring rows have no
 * location_id of their own), mirroring a Supabase select with nested relations.
 */
export interface EnrichedRecurringBooking extends RecurringBooking {
  client: EndClient
  resource: Resource
  location: Location
}

/** A client joined with lightweight booking stats for list views. */
export interface ClientWithStats extends EndClient {
  totalBookings: number
  lastVisit: string | null // ISO timestamp of the most recent past booking
}

/** A single labelled point for a chart series. */
export interface AnalyticsPoint {
  label: string
  value: number
}

/** Two-series point (e.g. booked vs capacity, new vs returning). */
export interface AnalyticsPairPoint {
  label: string
  primary: number
  secondary: number
}

/** Occupancy metrics: how full the venue is vs its capacity. */
export interface OccupancyMetrics {
  // Overall occupancy rate for the period (0–1).
  rate: number
  bookedSlots: number
  availableSlots: number
  // Occupancy rate per weekday (Mon→Sun) for the trend chart.
  byWeekday: AnalyticsPoint[]
  // Booked vs available slots per resource for the bar chart.
  byResource: AnalyticsPairPoint[]
}

/** No-show metrics: reliability of bookings. */
export interface NoShowMetrics {
  count: number
  totalBookings: number
  // No-show rate for the period (0–1).
  rate: number
  // Lost revenue from no-shows (informational, always safe to show as ops data).
  byWeekday: AnalyticsPoint[]
}

/** Retention metrics: new vs returning clients. */
export interface RetentionMetrics {
  totalClients: number
  returningClients: number
  newClients: number
  // Returning rate for the period (0–1).
  rate: number
  // Distribution of clients by number of bookings, for the chart.
  distribution: AnalyticsPoint[]
}

/** Revenue metrics — GATED behind analytics.view_financials. */
export interface RevenueMetrics {
  total: number
  averagePerBooking: number
  collected: number
  outstanding: number
  // Revenue per weekday (Mon→Sun) for the trend chart.
  byWeekday: AnalyticsPoint[]
  // Revenue per resource for the bar chart.
  byResource: AnalyticsPoint[]
}

/**
 * The full analytics payload for a period. `revenue` is always computed by the
 * data layer, but the page only passes it to the UI when the current user has
 * the analytics.view_financials permission.
 */
export interface AnalyticsMetrics {
  periodLabel: string
  occupancy: OccupancyMetrics
  noShow: NoShowMetrics
  retention: RetentionMetrics
  revenue: RevenueMetrics
}

/** Aggregated numbers for the dashboard home. */
export interface DashboardMetrics {
  date: string // "YYYY-MM-DD" the metrics were computed for
  bookingsToday: number
  confirmedToday: number
  pendingToday: number
  estimatedRevenueToday: number
  upcomingToday: EnrichedBooking[]
  noShowAlerts: EnrichedBooking[]
  unpaidAlerts: EnrichedBooking[]
}
