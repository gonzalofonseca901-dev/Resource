// Centralized date & time formatting for the whole app.
// UI components must import from here instead of re-implementing formatting,
// so locale rules (Spanish, Buenos Aires) and slot math live in one place.

import type { Currency } from "@/lib/types"

const DAY_MS = 24 * 60 * 60 * 1000

// getDay() index: 0 = Sunday ... 6 = Saturday.
const WEEKDAY_SHORT_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const WEEKDAY_LONG_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]
const MONTH_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

/** Parse an ISO string into a Date. Kept trivial so callers stay declarative. */
export function parseISO(iso: string): Date {
  return new Date(iso)
}

/** "19:00" — 24h local start time of an ISO timestamp. */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "19:00 – 20:30" for a booking's start/end pair. */
export function formatTimeRange(startISO: string, endISO: string): string {
  return `${formatTime(startISO)} – ${formatTime(endISO)}`
}

/** "lun 12" — short weekday + day-of-month. */
export function formatDayLabel(date: Date): string {
  return `${WEEKDAY_SHORT_ES[date.getDay()]} ${date.getDate()}`
}

/** "lunes" — long weekday name. */
export function formatWeekdayLong(date: Date): string {
  return WEEKDAY_LONG_ES[date.getDay()]
}

/** "lunes" — long weekday name from a 0=Sunday..6=Saturday index (DayOfWeek). */
export function formatDayOfWeek(day: number): string {
  return WEEKDAY_LONG_ES[day] ?? ""
}

/** "12/07/2026" — short numeric date from an ISO string. */
export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** "lunes 12 de julio" — full readable date. */
export function formatDateLong(date: Date): string {
  return `${WEEKDAY_LONG_ES[date.getDay()]} ${date.getDate()} de ${
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][
      date.getMonth()
    ]
  }`
}

/** Monday 00:00 of the week containing `date` (local time). */
export function startOfWeek(date: Date): Date {
  const day = date.getDay() // 0 = Sun ... 6 = Sat
  const diffToMonday = (day + 6) % 7
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setTime(monday.getTime() - diffToMonday * DAY_MS)
  return monday
}

/** Midnight of `date` (local time). */
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** `date` shifted by `days` (can be negative). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** The 7 dates (Mon→Sun) of the week containing `date`. */
export function getWeekDays(date: Date): Date[] {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** "7 – 13 jul" style label for a full week. */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const startMonth = MONTH_SHORT_ES[weekStart.getMonth()]
  const endMonth = MONTH_SHORT_ES[weekEnd.getMonth()]
  if (startMonth === endMonth) {
    return `${weekStart.getDate()} – ${weekEnd.getDate()} ${endMonth}`
  }
  return `${weekStart.getDate()} ${startMonth} – ${weekEnd.getDate()} ${endMonth}`
}

/** True when both dates fall on the same calendar day (local time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** True when `date` is today. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/** Minutes elapsed since local midnight for an ISO timestamp — used to position calendar blocks. */
export function minutesSinceMidnight(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/** Duration of a booking in minutes. */
export function durationMinutes(startISO: string, endISO: string): number {
  return Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000)
}

/** ISO timestamp `durationMin` minutes after the given ISO timestamp. */
export function addMinutesISO(iso: string, durationMin: number): string {
  return new Date(new Date(iso).getTime() + durationMin * 60 * 1000).toISOString()
}

/** Combine a "YYYY-MM-DD" date and "HH:mm" time (local) into an ISO timestamp. */
export function combineDateTimeISO(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number)
  const [h, mi] = time.split(":").map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0).toISOString()
}

/** "YYYY-MM-DD" for the local calendar day of an ISO timestamp (input[type=date] value). */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "$11.000" — currency formatting with Argentine grouping. */
export function formatCurrency(amount: number, currency: Currency = "ARS"): string {
  const symbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "$"
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${symbol}${grouped}`
}
