// Shared geometry for the agenda calendar grid.

/** First hour shown on the time axis (matches the earliest opening time). */
export const START_HOUR = 8
/** Boundary after the last slot (23:00 close). */
export const END_HOUR = 23
/** Pixel height of one hour row. */
export const HOUR_PX = 64

export const TOTAL_HOURS = END_HOUR - START_HOUR
export const GRID_HEIGHT = TOTAL_HOURS * HOUR_PX

/** Hour labels rendered down the time axis, e.g. [8, 9, ... 22]. */
export const HOUR_LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)
