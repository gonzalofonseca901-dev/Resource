// Schedule, pricing and block fetchers for a single resource. These mirror
// Supabase selects filtered by `resource_id`, ordered so the management UI reads
// predictably (schedules by weekday, pricing by descending priority).

import type { ResourcePricing, Schedule, ScheduleBlock } from "@/lib/types"
import {
  MOCK_PRICING,
  MOCK_SCHEDULES,
  MOCK_SCHEDULE_BLOCKS,
} from "@/lib/mock-data"

// Monday-first weekday order (values are 0=Sun..6=Sat).
const WEEKDAY_ORDER: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

/** Weekly opening schedule for a resource, ordered Monday→Sunday. */
export async function getSchedulesByResource(resourceId: string): Promise<Schedule[]> {
  return MOCK_SCHEDULES.filter((s) => s.resourceId === resourceId).sort(
    (a, b) => WEEKDAY_ORDER[a.dayOfWeek] - WEEKDAY_ORDER[b.dayOfWeek],
  )
}

/** Pricing rules for a resource, highest priority first. */
export async function getPricingByResource(resourceId: string): Promise<ResourcePricing[]> {
  return MOCK_PRICING.filter((p) => p.resourceId === resourceId).sort(
    (a, b) => b.priority - a.priority,
  )
}

/** Upcoming maintenance / reserved blocks for a resource, soonest first. */
export async function getScheduleBlocksByResource(
  resourceId: string,
): Promise<ScheduleBlock[]> {
  return MOCK_SCHEDULE_BLOCKS.filter((b) => b.resourceId === resourceId).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )
}
