import type { Booking, RecurringBooking } from "@/lib/types"
import { slotISO, addMinutesISO } from "./_date-utils"

const SLOT_MIN = 90

interface BookingSeed {
  id: string
  resourceId: string
  locationId: string
  endClientId: string
  weekOffset: number
  weekday: number // 0 = Mon ... 6 = Sun
  time: string
  status: Booking["status"]
  source: Booking["source"]
  price: number
  paymentStatus: Booking["paymentStatus"]
}

const SEEDS: BookingSeed[] = [
  // ---- This week ----
  {
    id: "bk-1", resourceId: "res-centro-1", locationId: "loc-centro", endClientId: "client-1",
    weekOffset: 0, weekday: 0, time: "19:00", status: "confirmed", source: "whatsapp_bot", price: 11000, paymentStatus: "paid",
  },
  {
    id: "bk-2", resourceId: "res-centro-2", locationId: "loc-centro", endClientId: "client-2",
    weekOffset: 0, weekday: 0, time: "20:30", status: "confirmed", source: "web", price: 11000, paymentStatus: "partial",
  },
  {
    id: "bk-3", resourceId: "res-costanera-1", locationId: "loc-costanera", endClientId: "client-4",
    weekOffset: 0, weekday: 1, time: "09:00", status: "completed", source: "backoffice_manual", price: 9000, paymentStatus: "paid",
  },
  {
    id: "bk-4", resourceId: "res-centro-1", locationId: "loc-centro", endClientId: "client-3",
    weekOffset: 0, weekday: 1, time: "18:00", status: "pending", source: "whatsapp_bot", price: 11000, paymentStatus: "pending",
  },
  {
    id: "bk-5", resourceId: "res-centro-2", locationId: "loc-centro", endClientId: "client-5",
    weekOffset: 0, weekday: 2, time: "21:00", status: "confirmed", source: "web", price: 11000, paymentStatus: "paid",
  },
  {
    id: "bk-6", resourceId: "res-costanera-2", locationId: "loc-costanera", endClientId: "client-6",
    weekOffset: 0, weekday: 2, time: "10:30", status: "cancelled", source: "whatsapp_bot", price: 9000, paymentStatus: "cancelled",
  },
  {
    id: "bk-7", resourceId: "res-costanera-1", locationId: "loc-costanera", endClientId: "client-7",
    weekOffset: 0, weekday: 3, time: "19:00", status: "confirmed", source: "whatsapp_bot", price: 11000, paymentStatus: "partial",
  },
  {
    id: "bk-8", resourceId: "res-centro-1", locationId: "loc-centro", endClientId: "client-8",
    weekOffset: 0, weekday: 4, time: "20:30", status: "confirmed", source: "web", price: 11000, paymentStatus: "paid",
  },
  {
    id: "bk-9", resourceId: "res-centro-2", locationId: "loc-centro", endClientId: "client-1",
    weekOffset: 0, weekday: 4, time: "18:00", status: "no_show", source: "whatsapp_bot", price: 11000, paymentStatus: "pending",
  },
  {
    id: "bk-10", resourceId: "res-costanera-2", locationId: "loc-costanera", endClientId: "client-2",
    weekOffset: 0, weekday: 5, time: "11:00", status: "confirmed", source: "backoffice_manual", price: 12000, paymentStatus: "paid",
  },
  {
    id: "bk-11", resourceId: "res-costanera-1", locationId: "loc-costanera", endClientId: "client-4",
    weekOffset: 0, weekday: 6, time: "12:30", status: "confirmed", source: "web", price: 12000, paymentStatus: "partial",
  },
  {
    id: "bk-12", resourceId: "res-centro-1", locationId: "loc-centro", endClientId: "client-6",
    weekOffset: 0, weekday: 6, time: "16:00", status: "pending", source: "whatsapp_bot", price: 12000, paymentStatus: "pending",
  },
  // ---- Next week ----
  {
    id: "bk-13", resourceId: "res-centro-2", locationId: "loc-centro", endClientId: "client-3",
    weekOffset: 1, weekday: 0, time: "19:00", status: "confirmed", source: "whatsapp_bot", price: 11000, paymentStatus: "pending",
  },
  {
    id: "bk-14", resourceId: "res-costanera-1", locationId: "loc-costanera", endClientId: "client-5",
    weekOffset: 1, weekday: 1, time: "20:30", status: "confirmed", source: "web", price: 11000, paymentStatus: "paid",
  },
  {
    id: "bk-15", resourceId: "res-centro-1", locationId: "loc-centro", endClientId: "client-7",
    weekOffset: 1, weekday: 2, time: "18:00", status: "confirmed", source: "backoffice_manual", price: 11000, paymentStatus: "partial",
  },
  {
    id: "bk-16", resourceId: "res-costanera-2", locationId: "loc-costanera", endClientId: "client-8",
    weekOffset: 1, weekday: 3, time: "09:00", status: "pending", source: "whatsapp_bot", price: 9000, paymentStatus: "pending",
  },
  {
    id: "bk-17", resourceId: "res-centro-2", locationId: "loc-centro", endClientId: "client-2",
    weekOffset: 1, weekday: 4, time: "21:00", status: "confirmed", source: "web", price: 11000, paymentStatus: "paid",
  },
  {
    id: "bk-18", resourceId: "res-costanera-1", locationId: "loc-costanera", endClientId: "client-1",
    weekOffset: 1, weekday: 6, time: "10:30", status: "confirmed", source: "whatsapp_bot", price: 12000, paymentStatus: "partial",
  },
]

export const MOCK_BOOKINGS: Booking[] = SEEDS.map((seed) => {
  const startsAt = slotISO(seed.weekOffset, seed.weekday, seed.time)
  return {
    id: seed.id,
    resourceId: seed.resourceId,
    locationId: seed.locationId,
    endClientId: seed.endClientId,
    startsAt,
    endsAt: addMinutesISO(startsAt, SLOT_MIN),
    status: seed.status,
    source: seed.source,
    price: seed.price,
    paymentStatus: seed.paymentStatus,
  }
})

export const MOCK_RECURRING_BOOKINGS: RecurringBooking[] = [
  {
    id: "rec-1",
    resourceId: "res-centro-1",
    endClientId: "client-4",
    dayOfWeek: 2, // Tuesday
    startTime: "20:00",
    endTime: "21:30",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
    status: "active",
    price: 11000,
    currency: "ARS",
  },
  {
    id: "rec-2",
    resourceId: "res-costanera-2",
    endClientId: "client-8",
    dayOfWeek: 5, // Friday
    startTime: "19:00",
    endTime: "20:30",
    validFrom: "2026-03-01",
    status: "active",
    price: 11000,
    currency: "ARS",
  },
]
