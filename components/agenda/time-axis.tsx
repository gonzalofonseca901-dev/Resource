import { HOUR_LABELS, HOUR_PX, GRID_HEIGHT } from "./constants"

/** Left-hand hour labels, aligned with the resource columns' grid lines. */
export function TimeAxis() {
  return (
    <div className="sticky left-0 z-10 w-14 shrink-0 bg-background">
      {/* Spacer matching the column header height. */}
      <div className="sticky top-0 z-10 h-12 border-b border-border bg-background" />
      <div className="relative" style={{ height: GRID_HEIGHT }}>
        {HOUR_LABELS.map((hour, index) => (
          <div
            key={hour}
            className="absolute right-2 -translate-y-1/2 font-mono text-[11px] tabular-nums text-muted-foreground"
            style={{ top: index * HOUR_PX }}
          >
            {hour.toString().padStart(2, "0")}:00
          </div>
        ))}
      </div>
    </div>
  )
}
