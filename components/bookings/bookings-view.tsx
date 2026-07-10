"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import type { EndClient, Location, Resource } from "@/lib/types"
import type { EnrichedBooking } from "@/lib/data"
import {
  EMPTY_BOOKING_FILTERS,
  filterBookings,
  hasActiveBookingFilters,
  type BookingFilters,
} from "@/lib/booking-filters"
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
  bookings: initialBookings,
  locations,
  resources,
  clients,
  permissions,
}: BookingsViewProps) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>(initialBookings)
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_BOOKING_FILTERS)

  // null = closed, "new" = create, otherwise the booking being edited.
  const [formTarget, setFormTarget] = useState<EnrichedBooking | "new" | null>(null)
  const [cancelTarget, setCancelTarget] = useState<EnrichedBooking | null>(null)

  const visibleBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  )

  const showLocation = locations.length > 1

  /** Rebuild an enriched booking from a raw draft using the loaded lookups. */
  function enrich(draft: BookingDraft): EnrichedBooking | null {
    const client = clients.find((c) => c.id === draft.endClientId)
    const resource = resources.find((r) => r.id === draft.resourceId)
    const location = locations.find((l) => l.id === resource?.locationId)
    if (!client || !resource || !location) return null
    return { ...draft, locationId: location.id, client, resource, location }
  }

  function handleSubmit(draft: BookingDraft) {
    const enriched = enrich(draft)
    if (!enriched) return
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === enriched.id)
      const next = exists
        ? prev.map((b) => (b.id === enriched.id ? enriched : b))
        : [enriched, ...prev]
      return next.sort(
        (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      )
    })
    setFormTarget(null)
  }

  function handleConfirmCancel() {
    if (!cancelTarget) return
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelTarget.id
          ? { ...b, status: "cancelled", paymentStatus: "cancelled" }
          : b,
      ),
    )
    setCancelTarget(null)
  }

  return (
    <div className="flex flex-col gap-4">
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
      />

      <CancelBookingDialog
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
