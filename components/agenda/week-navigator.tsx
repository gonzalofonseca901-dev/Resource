"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatWeekRange } from "@/lib/date-utils"

interface WeekNavigatorProps {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function WeekNavigator({ weekStart, onPrev, onNext, onToday }: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border border-border bg-card">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Semana anterior"
          className="flex size-8 items-center justify-center rounded-l-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Semana siguiente"
          className="flex size-8 items-center justify-center rounded-r-md border-l border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToday}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        Hoy
      </button>
      <span className="text-sm font-medium capitalize">{formatWeekRange(weekStart)}</span>
    </div>
  )
}
