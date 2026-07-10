"use client"

import { cn } from "@/lib/utils"
import { getWeekDays, isSameDay, isToday } from "@/lib/date-utils"

const WEEKDAY_INITIALS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]

interface DayTabsProps {
  weekStart: Date
  selectedDay: Date
  onSelect: (day: Date) => void
}

export function DayTabs({ weekStart, selectedDay, onSelect }: DayTabsProps) {
  const days = getWeekDays(weekStart)

  return (
    <div role="tablist" className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const active = isSameDay(day, selectedDay)
        const today = isToday(day)
        return (
          <button
            key={day.toISOString()}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md border px-1 py-2 text-center transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span className="text-[11px] font-medium uppercase">
              {WEEKDAY_INITIALS[day.getDay()]}
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold tabular-nums",
                today && !active && "text-primary",
              )}
            >
              {day.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
