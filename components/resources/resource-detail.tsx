"use client"

import { useState } from "react"
import { CalendarClock, MapPin, Pencil, Power, DollarSign, Info } from "lucide-react"
import type { Location, Resource, ResourcePricing, Schedule, ScheduleBlock } from "@/lib/types"
import { RESOURCE_TYPE_META } from "@/lib/resource-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, type TabItem } from "@/components/ui/tabs"
import type { ResourcesPermissions } from "./resources-view"
import { ResourceScheduleEditor } from "./resource-schedule-editor"
import { ResourcePricingEditor } from "./resource-pricing-editor"

interface ResourceDetailProps {
  resource: Resource | null
  location: Location | null
  schedules: Schedule[]
  pricing: ResourcePricing[]
  blocks: ScheduleBlock[]
  permissions: ResourcesPermissions
  onEdit: () => void
  onToggleActive: () => void
}

export function ResourceDetail({
  resource,
  location,
  schedules,
  pricing,
  blocks,
  permissions,
  onEdit,
  onToggleActive,
}: ResourceDetailProps) {
  const [tab, setTab] = useState("general")

  if (!resource) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Elegí un recurso de la lista para ver y editar su configuración.
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div className="min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{resource.name}</h2>
            {resource.isActive ? (
              <Badge tone="success">Activo</Badge>
            ) : (
              <Badge tone="muted">Inactivo</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{RESOURCE_TYPE_META[resource.type]}</span>
            <span aria-hidden="true">·</span>
            <span>Capacidad {resource.capacity}</span>
            {location && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="size-3" aria-hidden="true" />
                  {location.name}
                </span>
              </>
            )}
          </div>
        </div>
        {permissions.canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onToggleActive}>
              <Power className="size-3.5" aria-hidden="true" />
              {resource.isActive ? "Desactivar" : "Activar"}
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Editar
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Tabs items={TABS} value={tab} onValueChange={setTab} aria-label="Secciones del recurso" />

        {tab === "general" && (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-muted-foreground">Tipo</dt>
              <dd className="text-sm">{RESOURCE_TYPE_META[resource.type]}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-muted-foreground">Capacidad</dt>
              <dd className="text-sm tabular-nums">{resource.capacity}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Descripción</dt>
              <dd className="text-sm leading-relaxed text-pretty">
                {resource.description || "Sin descripción."}
              </dd>
            </div>
          </dl>
        )}

        {tab === "schedules" && (
          <ResourceScheduleEditor
            resourceId={resource.id}
            schedules={schedules}
            blocks={blocks}
            canManage={permissions.canManageSchedules}
          />
        )}

        {tab === "pricing" && (
          <ResourcePricingEditor
            resourceId={resource.id}
            pricing={pricing}
            canManage={permissions.canManagePricing}
          />
        )}
      </div>
    </div>
  )
}

const TABS: TabItem[] = [
  { key: "general", label: "Datos", icon: Info },
  { key: "schedules", label: "Horarios", icon: CalendarClock },
  { key: "pricing", label: "Precios", icon: DollarSign },
]
