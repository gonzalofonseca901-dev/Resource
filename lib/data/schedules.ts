// Schedule, pricing and block fetchers for a single resource, implementación real.
// Postgres `time` vuelve como "HH:mm:ss" — se trunca a "HH:mm" como espera el frontend.

import type { ResourcePricing, Schedule, ScheduleBlock } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

// Monday-first weekday order (values are 0=Sun..6=Sat).
const WEEKDAY_ORDER: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

function toHHmm(time: string): string {
  return time.slice(0, 5)
}

/** Weekly opening schedule for a resource, ordered Monday→Sunday. */
export async function getSchedulesByResource(resourceId: string): Promise<Schedule[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("resource_id", resourceId)

  if (error) throw new Error(`No se pudieron cargar los horarios: ${error.message}`)

  return (data ?? [])
    .map(
      (s): Schedule => ({
        id: s.id,
        resourceId: s.resource_id,
        dayOfWeek: s.day_of_week,
        openTime: toHHmm(s.open_time),
        closeTime: toHHmm(s.close_time),
        slotDurationMin: s.slot_duration_min,
        isActive: s.is_active,
      }),
    )
    .sort((a, b) => WEEKDAY_ORDER[a.dayOfWeek] - WEEKDAY_ORDER[b.dayOfWeek])
}

/** Pricing rules for a resource, highest priority first. */
export async function getPricingByResource(resourceId: string): Promise<ResourcePricing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resource_pricing")
    .select("*")
    .eq("resource_id", resourceId)
    .order("priority", { ascending: false })

  if (error) throw new Error(`No se pudieron cargar los precios: ${error.message}`)

  return (data ?? []).map(
    (p): ResourcePricing => ({
      id: p.id,
      resourceId: p.resource_id,
      ruleType: p.rule_type,
      dayOfWeek: p.day_of_week ?? undefined,
      fromTime: p.from_time ? toHHmm(p.from_time) : undefined,
      toTime: p.to_time ? toHHmm(p.to_time) : undefined,
      specificDate: p.specific_date ?? undefined,
      price: Number(p.price),
      currency: p.currency,
      priority: p.priority,
    }),
  )
}

/** Same as getScheduleBlocksByResource but batched across many resources at once. */
export async function getScheduleBlocksByResources(
  resourceIds: string[],
): Promise<Record<string, ScheduleBlock[]>> {
  if (resourceIds.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .in("resource_id", resourceIds)
    .order("starts_at")

  if (error) throw new Error(`No se pudieron cargar los bloqueos: ${error.message}`)

  const byResource: Record<string, ScheduleBlock[]> = {}
  for (const id of resourceIds) byResource[id] = []
  for (const b of data ?? []) {
    byResource[b.resource_id]?.push({
      id: b.id,
      resourceId: b.resource_id,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      reason: b.reason ?? "",
    })
  }
  return byResource
}

/** Same as getSchedulesByResource but batched across many resources at once. */
export async function getSchedulesByResources(
  resourceIds: string[],
): Promise<Record<string, Schedule[]>> {
  if (resourceIds.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase.from("schedules").select("*").in("resource_id", resourceIds)

  if (error) throw new Error(`No se pudieron cargar los horarios: ${error.message}`)

  const byResource: Record<string, Schedule[]> = {}
  for (const id of resourceIds) byResource[id] = []
  for (const s of data ?? []) {
    byResource[s.resource_id]?.push({
      id: s.id,
      resourceId: s.resource_id,
      dayOfWeek: s.day_of_week,
      openTime: toHHmm(s.open_time),
      closeTime: toHHmm(s.close_time),
      slotDurationMin: s.slot_duration_min,
      isActive: s.is_active,
    })
  }
  for (const id of resourceIds) {
    byResource[id].sort((a, b) => WEEKDAY_ORDER[a.dayOfWeek] - WEEKDAY_ORDER[b.dayOfWeek])
  }
  return byResource
}

/** Same as getPricingByResource but batched across many resources at once. */
export async function getPricingByResources(
  resourceIds: string[],
): Promise<Record<string, ResourcePricing[]>> {
  if (resourceIds.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resource_pricing")
    .select("*")
    .in("resource_id", resourceIds)
    .order("priority", { ascending: false })

  if (error) throw new Error(`No se pudieron cargar los precios: ${error.message}`)

  const byResource: Record<string, ResourcePricing[]> = {}
  for (const id of resourceIds) byResource[id] = []
  for (const p of data ?? []) {
    byResource[p.resource_id]?.push({
      id: p.id,
      resourceId: p.resource_id,
      ruleType: p.rule_type,
      dayOfWeek: p.day_of_week ?? undefined,
      fromTime: p.from_time ? toHHmm(p.from_time) : undefined,
      toTime: p.to_time ? toHHmm(p.to_time) : undefined,
      specificDate: p.specific_date ?? undefined,
      price: Number(p.price),
      currency: p.currency,
      priority: p.priority,
    })
  }
  return byResource
}
export async function getScheduleBlocksByResource(
  resourceId: string,
): Promise<ScheduleBlock[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("resource_id", resourceId)
    .order("starts_at")

  if (error) throw new Error(`No se pudieron cargar los bloqueos: ${error.message}`)

  return (data ?? []).map(
    (b): ScheduleBlock => ({
      id: b.id,
      resourceId: b.resource_id,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      reason: b.reason ?? "",
    }),
  )
}
