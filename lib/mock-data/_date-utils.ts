// Internal helpers for generating realistic, always-current mock timestamps.
// Not part of the domain — used only to keep mocked bookings anchored to the
// current week so the calendar is never empty. Real data will come as ISO
// strings straight from Supabase.

const DAY_MS = 24 * 60 * 60 * 1000

/** Monday 00:00 of the current week, in local time. */
function startOfThisWeek(): Date {
  const now = new Date()
  const day = now.getDay() // 0 = Sun ... 6 = Sat
  const diffToMonday = (day + 6) % 7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setTime(monday.getTime() - diffToMonday * DAY_MS)
  return monday
}

/**
 * Build an ISO timestamp for a slot in the current or next week.
 *
 * @param weekOffset 0 = this week, 1 = next week
 * @param weekday    0 = Monday ... 6 = Sunday (relative to week start)
 * @param time       "HH:mm" local start time
 */
export function slotISO(weekOffset: number, weekday: number, time: string): string {
  const [h, m] = time.split(":").map(Number)
  const base = startOfThisWeek()
  const d = new Date(base.getTime() + (weekOffset * 7 + weekday) * DAY_MS)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

/** ISO timestamp `durationMin` after the given ISO timestamp. */
export function addMinutesISO(iso: string, durationMin: number): string {
  return new Date(new Date(iso).getTime() + durationMin * 60 * 1000).toISOString()
}

/** "YYYY-MM-DD" for a date offset in days from today. */
export function dateOnly(daysFromToday: number): string {
  const d = new Date(Date.now() + daysFromToday * DAY_MS)
  return d.toISOString().slice(0, 10)
}
