"use client"

import { MapPin } from "lucide-react"
import type { Location, Resource } from "@/lib/types"
import { RESOURCE_TYPE_META } from "@/lib/resource-display"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ResourceListProps {
  resources: Resource[]
  locations: Location[]
  showLocation: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ResourceList({
  resources,
  locations,
  showLocation,
  selectedId,
  onSelect,
}: ResourceListProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Recursos</h2>
        <p className="text-xs text-muted-foreground">{resources.length} en total</p>
      </div>
      <ul className="flex flex-col">
        {resources.map((resource) => {
          const active = resource.id === selectedId
          const location = locations.find((l) => l.id === resource.locationId)
          return (
            <li key={resource.id}>
              <button
                type="button"
                onClick={() => onSelect(resource.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors last:border-0",
                  active ? "bg-accent" : "hover:bg-secondary/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{resource.name}</span>
                  {!resource.isActive && <Badge tone="muted">Inactivo</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{RESOURCE_TYPE_META[resource.type]}</span>
                  <span aria-hidden="true">·</span>
                  <span>Cap. {resource.capacity}</span>
                  {showLocation && location && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="size-3" aria-hidden="true" />
                        {location.city}
                      </span>
                    </>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
