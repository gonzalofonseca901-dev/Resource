"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type { EndClient, Location, Resource } from "@/lib/types"
import type { EnrichedRecurringBooking } from "@/lib/data"
import {
  createRecurringSeriesAction,
  cancelRecurringSeriesAction,
  cancelRecurringOccurrenceAction,
} from "@/lib/actions/recurring"
import { Button } from "@/components/ui/button"
import { RecurringTable } from "./recurring-table"
import { RecurringFormDialog, type RecurringDraft } from "./recurring-form-dialog"
import { CancelSeriesDialog, type SeriesCancellation } from "./cancel-series-dialog"

export interface RecurringPermissions {
  canCreate: boolean
  canCancel: boolean
}

interface RecurringViewProps {
  series: EnrichedRecurringBooking[]
  locations: Location[]
  resources: Resource[]
  clients: EndClient[]
  permissions: RecurringPermissions
  initialExceptions: Record<string, string[]>
}

export function RecurringView({
  series,
  locations,
  resources,
  clients,
  permissions,
  initialExceptions,
}: RecurringViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<EnrichedRecurringBooking | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showLocation = locations.length > 1

  function handleCreate(draft: RecurringDraft) {
    setError(null)
    startTransition(async () => {
      const result = await createRecurringSeriesAction(draft)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setCreating(false)
      router.refresh()
    })
  }

  function handleCancel(result: SeriesCancellation) {
    setError(null)
    startTransition(async () => {
      const actionResult =
        result.scope === "series"
          ? await cancelRecurringSeriesAction(result.seriesId)
          : await cancelRecurringOccurrenceAction(result.seriesId, result.date)

      if (!actionResult.ok) {
        setError(actionResult.error)
        return
      }
      setCancelTarget(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {permissions.canCreate && (
        <div className="flex justify-end">
          <Button size="lg" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva serie
          </Button>
        </div>
      )}

      <RecurringTable
        series={series}
        exceptions={initialExceptions}
        showLocation={showLocation}
        canCancel={permissions.canCancel}
        onCancel={(s) => setCancelTarget(s)}
      />

      <RecurringFormDialog
        open={creating}
        clients={clients}
        resources={resources}
        locations={locations}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
        submitting={isPending}
      />

      <CancelSeriesDialog
        series={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        submitting={isPending}
      />
    </div>
  )
}
