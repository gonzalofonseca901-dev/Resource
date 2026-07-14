"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type {
  Location,
  Resource,
  ResourcePricing,
  Schedule,
  ScheduleBlock,
} from "@/lib/types"
import {
  createResourceAction,
  updateResourceAction,
  toggleResourceActiveAction,
} from "@/lib/actions/resources"
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
  resources,
  locations,
  schedulesByResource,
  pricingByResource,
  blocksByResource,
  permissions,
}: ResourcesViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(resources[0]?.id ?? null)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showLocation = locations.length > 1

  const selected = useMemo(
    () => resources.find((r) => r.id === selectedId) ?? null,
    [resources, selectedId],
  )

  function handleSubmit(draft: ResourceDraft) {
    setError(null)
    startTransition(async () => {
      const result = draft.id
        ? await updateResourceAction({ ...draft, id: draft.id })
        : await createResourceAction(draft)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setCreating(false)
      setEditing(null)
      router.refresh()
    })
  }

  function handleToggleActive(resource: Resource) {
    setError(null)
    startTransition(async () => {
      const result = await toggleResourceActiveAction(resource.id, !resource.isActive)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
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
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

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
          disabled={isPending}
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
        submitting={isPending}
      />
    </div>
  )
}
