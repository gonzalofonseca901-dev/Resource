"use client"

import { MapPin } from "lucide-react"
import type { Location } from "@/lib/types"
import { cn } from "@/lib/utils"

export const ALL_LOCATIONS = "all"

interface LocationFilterProps {
  locations: Location[]
  value: string
  onChange: (value: string) => void
}

/**
 * Segmented filter over the locations the user is allowed to see.
 * The "Todas" option only appears when more than one location is available.
 */
export function LocationFilter({ locations, value, onChange }: LocationFilterProps) {
  if (locations.length <= 1) return null

  const options = [
    { id: ALL_LOCATIONS, label: "Todas las sedes" },
    ...locations.map((l) => ({ id: l.id, label: l.name })),
  ]

  return (
    <div
      role="group"
      aria-label="Filtrar por sede"
      className="inline-flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1"
    >
      {options.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <MapPin className="size-3.5" aria-hidden="true" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
