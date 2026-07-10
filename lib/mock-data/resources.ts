import type { DayOfWeek, Resource, ResourcePricing, Schedule, ScheduleBlock } from "@/lib/types"
import { slotISO, addMinutesISO } from "./_date-utils"

export const MOCK_RESOURCES: Resource[] = [
  {
    id: "res-centro-1",
    locationId: "loc-centro",
    businessId: "biz-padel-norte",
    name: "Cancha 1 - Cristal",
    type: "court",
    description: "Cancha panorámica de cristal, techada, con iluminación LED.",
    capacity: 4,
    isActive: true,
  },
  {
    id: "res-centro-2",
    locationId: "loc-centro",
    businessId: "biz-padel-norte",
    name: "Cancha 2 - Cristal",
    type: "court",
    description: "Cancha de cristal techada, ideal para juego nocturno.",
    capacity: 4,
    isActive: true,
  },
  {
    id: "res-centro-3",
    locationId: "loc-centro",
    businessId: "biz-padel-norte",
    name: "Cancha 3 - Muro",
    type: "court",
    description: "Cancha de muro semi-descubierta.",
    capacity: 4,
    isActive: false,
  },
  {
    id: "res-costanera-1",
    locationId: "loc-costanera",
    businessId: "biz-padel-norte",
    name: "Cancha 1 - Panorámica",
    type: "court",
    description: "Cancha panorámica con vista al río.",
    capacity: 4,
    isActive: true,
  },
  {
    id: "res-costanera-2",
    locationId: "loc-costanera",
    businessId: "biz-padel-norte",
    name: "Cancha 2 - Cristal",
    type: "court",
    description: "Cancha de cristal techada.",
    capacity: 4,
    isActive: true,
  },
]

// Weekday open hours 08:00-23:00, weekends 09:00-22:00, 90-min slots.
const WEEKDAYS: DayOfWeek[] = [1, 2, 3, 4, 5]
const WEEKENDS: DayOfWeek[] = [0, 6]

function buildSchedules(): Schedule[] {
  const schedules: Schedule[] = []
  for (const resource of MOCK_RESOURCES) {
    for (const dayOfWeek of WEEKDAYS) {
      schedules.push({
        id: `sch-${resource.id}-${dayOfWeek}`,
        resourceId: resource.id,
        dayOfWeek,
        openTime: "08:00",
        closeTime: "23:00",
        slotDurationMin: 90,
        isActive: resource.isActive,
      })
    }
    for (const dayOfWeek of WEEKENDS) {
      schedules.push({
        id: `sch-${resource.id}-${dayOfWeek}`,
        resourceId: resource.id,
        dayOfWeek,
        openTime: "09:00",
        closeTime: "22:00",
        slotDurationMin: 90,
        isActive: resource.isActive,
      })
    }
  }
  return schedules
}

export const MOCK_SCHEDULES: Schedule[] = buildSchedules()

// Base price per court + weekend premium + evening peak (18:00-23:00 weekdays).
function buildPricing(): ResourcePricing[] {
  const pricing: ResourcePricing[] = []
  for (const resource of MOCK_RESOURCES) {
    pricing.push({
      id: `price-${resource.id}-base`,
      resourceId: resource.id,
      ruleType: "base",
      price: 9000,
      currency: "ARS",
      priority: 0,
    })
    // Weekend premium (Saturday & Sunday).
    for (const dayOfWeek of WEEKENDS) {
      pricing.push({
        id: `price-${resource.id}-weekend-${dayOfWeek}`,
        resourceId: resource.id,
        ruleType: "day_of_week",
        dayOfWeek,
        price: 12000,
        currency: "ARS",
        priority: 10,
      })
    }
    // Weekday evening peak.
    pricing.push({
      id: `price-${resource.id}-evening`,
      resourceId: resource.id,
      ruleType: "time_range",
      fromTime: "18:00",
      toTime: "23:00",
      price: 11000,
      currency: "ARS",
      priority: 20,
    })
  }
  return pricing
}

export const MOCK_PRICING: ResourcePricing[] = buildPricing()

// A maintenance block this week on Centro - Cancha 1.
export const MOCK_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  {
    id: "block-centro-1-maint",
    resourceId: "res-centro-1",
    startsAt: slotISO(0, 2, "14:00"),
    endsAt: addMinutesISO(slotISO(0, 2, "14:00"), 180),
    reason: "Mantenimiento de césped sintético",
  },
  {
    id: "block-costanera-1-event",
    resourceId: "res-costanera-1",
    startsAt: slotISO(1, 5, "10:00"),
    endsAt: addMinutesISO(slotISO(1, 5, "10:00"), 360),
    reason: "Torneo interno reservado",
  },
]
