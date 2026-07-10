"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import type {
  Location,
  Resource,
  ResourcePricing,
  Schedule,
  ScheduleBlock,
} from "@/lib/types"
import { tempId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ResourceList } from "./resource-list"
import { ResourceDetail } from "./resource-detail"
import { ResourceFormDialog, type ResourceDraft } from "./resource-form-dialog"

export interface ResourcesPermissions {
  canView: boolean
  canManage: boolean
  canManageSchedules: boolean
  canManagePricing: boolean
}

interface ResourcesViewProps {
  resources: Resource[]
  locations: Location[]
  schedulesByResource: Record<string, Schedule[]>
  pricingByResource: Record<string, ResourcePricing[]>
  blocksByResource: Record<string, ScheduleBlock[]>
  permissions: ResourcesPermissions
}

export function ResourcesView({
  resources: initialResources,
  locations,
  schedulesByResource,
  pricingByResource,
  blocksByResource,
  permissions,
}: ResourcesViewProps) {
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [selectedId, setSelectedId] = useState<string | null>(initialResources[0]?.id ?? null)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [creating, setCreating] = useState(false)

  const showLocation = locations.length > 1

  const selected = useMemo(
    () => resources.find((r) => r.id === selectedId) ?? null,
    [resources, selectedId],
  )

  function handleSubmit(draft: ResourceDraft) {
    if (draft.id) {
      setResources((prev) => prev.map((r) => (r.id === draft.id ? { ...r, ...draft } : r)))
    } else {
      const created: Resource = { ...draft, id: tempId("res") }
      setResources((prev) => [...prev, created])
      setSelectedId(created.id)
    }
    setCreating(false)
    setEditing(null)
  }

  function handleToggleActive(resource: Resource) {
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, isActive: !r.isActive } : r)),
    )
  }

  if (!permissions.canView) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No tenés permisos para ver los recursos.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {permissions.canManage && (
        <div className="flex justify-end">
          <Button size="lg" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo recurso
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
        <ResourceList
          resources={resources}
          locations={locations}
          showLocation={showLocation}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <ResourceDetail
          resource={selected}
          location={locations.find((l) => l.id === selected?.locationId) ?? null}
          schedules={selected ? (schedulesByResource[selected.id] ?? []) : []}
          pricing={selected ? (pricingByResource[selected.id] ?? []) : []}
          blocks={selected ? (blocksByResource[selected.id] ?? []) : []}
          permissions={permissions}
          onEdit={() => selected && setEditing(selected)}
          onToggleActive={() => selected && handleToggleActive(selected)}
        />
      </div>

      <ResourceFormDialog
        open={creating || editing !== null}
        resource={editing}
        locations={locations}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
