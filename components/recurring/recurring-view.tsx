"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { EndClient, Location, Resource } from "@/lib/types"
import type { EnrichedRecurringBooking } from "@/lib/data"
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
}

export function RecurringView({
  series: initialSeries,
  locations,
  resources,
  clients,
  permissions,
}: RecurringViewProps) {
  const [series, setSeries] = useState<EnrichedRecurringBooking[]>(initialSeries)
  const [creating, setCreating] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<EnrichedRecurringBooking | null>(null)
  // Dates (per series id) cancelled as one-off exceptions.
  const [exceptions, setExceptions] = useState<Record<string, string[]>>({})

  const showLocation = locations.length > 1

  function enrich(draft: RecurringDraft): EnrichedRecurringBooking | null {
    const client = clients.find((c) => c.id === draft.endClientId)
    const resource = resources.find((r) => r.id === draft.resourceId)
    const location = locations.find((l) => l.id === resource?.locationId)
    if (!client || !resource || !location) return null
    return { ...draft, client, resource, location }
  }

  function handleCreate(draft: RecurringDraft) {
    const enriched = enrich(draft)
    if (!enriched) return
    setSeries((prev) =>
      [enriched, ...prev].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.startTime.localeCompare(b.startTime)
      }),
    )
    setCreating(false)
  }

  function handleCancel(result: SeriesCancellation) {
    if (result.scope === "series") {
      setSeries((prev) =>
        prev.map((s) => (s.id === result.seriesId ? { ...s, status: "cancelled" } : s)),
      )
    } else {
      setExceptions((prev) => {
        const current = prev[result.seriesId] ?? []
        if (current.includes(result.date)) return prev
        return { ...prev, [result.seriesId]: [...current, result.date] }
      })
    }
    setCancelTarget(null)
  }

  return (
    <div className="flex flex-col gap-4">
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
        exceptions={exceptions}
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
      />

      <CancelSeriesDialog
        series={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </div>
  )
}
