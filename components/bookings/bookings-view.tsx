"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type { EndClient, Location, Resource } from "@/lib/types"
import type { EnrichedBooking } from "@/lib/data"
import {
  EMPTY_BOOKING_FILTERS,
  filterBookings,
  hasActiveBookingFilters,
  type BookingFilters,
} from "@/lib/booking-filters"
import { createBookingAction, updateBookingAction, cancelBookingAction } from "@/lib/actions/bookings"
import { Button } from "@/components/ui/button"
import { BookingsFilters } from "./bookings-filters"
import { BookingsTable } from "./bookings-table"
import { BookingFormDialog, type BookingDraft } from "./booking-form-dialog"
import { CancelBookingDialog } from "./cancel-booking-dialog"

export interface BookingPermissions {
  canCreate: boolean
  canEdit: boolean
  canCancel: boolean
}

interface BookingsViewProps {
  bookings: EnrichedBooking[]
  locations: Location[]
  resources: Resource[]
  clients: EndClient[]
  permissions: BookingPermissions
}

export function BookingsView({
  bookings,
  locations,
  resources,
  clients,
  permissions,
}: BookingsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_BOOKING_FILTERS)
  const [error, setError] = useState<string | null>(null)

  // null = closed, "new" = create, otherwise the booking being edited.
  const [formTarget, setFormTarget] = useState<EnrichedBooking | "new" | null>(null)
  const [cancelTarget, setCancelTarget] = useState<EnrichedBooking | null>(null)

  const visibleBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  )

  const showLocation = locations.length > 1
  const isEditing = formTarget !== "new" && formTarget !== null

  function handleSubmit(draft: BookingDraft) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateBookingAction(draft)
        : await createBookingAction(draft)

      if (!result.ok) {
        setError(result.error)
        return
      }
      setFormTarget(null)
      router.refresh()
    })
  }

  function handleConfirmCancel() {
    if (!cancelTarget) return
    setError(null)
    startTransition(async () => {
      const result = await cancelBookingAction(cancelTarget.id)
      if (!result.ok) {
        setError(result.error)
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <BookingsFilters
          locations={locations}
          resources={resources}
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_BOOKING_FILTERS)}
          canClear={hasActiveBookingFilters(filters)}
        />
        {permissions.canCreate && (
          <Button size="lg" onClick={() => setFormTarget("new")} className="shrink-0">
            <Plus className="size-4" aria-hidden="true" />
            Nueva reserva
          </Button>
        )}
      </div>

      <BookingsTable
        bookings={visibleBookings}
        totalCount={bookings.length}
        showLocation={showLocation}
        permissions={permissions}
        onEdit={(booking) => setFormTarget(booking)}
        onCancel={(booking) => setCancelTarget(booking)}
      />

      <BookingFormDialog
        open={formTarget !== null}
        booking={formTarget === "new" ? null : formTarget}
        clients={clients}
        resources={resources}
        locations={locations}
        onClose={() => setFormTarget(null)}
        onSubmit={handleSubmit}
        submitting={isPending}
      />

      <CancelBookingDialog
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        submitting={isPending}
      />
    </div>
  )
}
