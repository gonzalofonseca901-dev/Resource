"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  Booking,
  BookingStatus,
  EndClient,
  Location,
  PaymentStatus,
  Resource,
} from "@/lib/types"
import type { EnrichedBooking } from "@/lib/data"
import {
  addMinutesISO,
  combineDateTimeISO,
  durationMinutes,
  formatTime,
  toDateInputValue,
} from "@/lib/date-utils"
import { PAYMENT_META, STATUS_META } from "@/lib/booking-display"
import { tempId } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// The dialog emits a raw Booking; the view enriches it with joined entities.
export type BookingDraft = Booking

const STATUS_ORDER: BookingStatus[] = [
  "confirmed",
  "pending",
  "completed",
  "no_show",
  "cancelled",
]
const PAYMENT_ORDER: PaymentStatus[] = ["pending", "partial", "paid", "cancelled"]
const DURATIONS = [60, 90, 120]

interface FormState {
  endClientId: string
  resourceId: string
  date: string
  time: string
  durationMin: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  price: number
}

function initialState(booking: EnrichedBooking | null, resources: Resource[]): FormState {
  if (booking) {
    return {
      endClientId: booking.endClientId,
      resourceId: booking.resourceId,
      date: toDateInputValue(booking.startsAt),
      time: formatTime(booking.startsAt),
      durationMin: durationMinutes(booking.startsAt, booking.endsAt),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      price: booking.price,
    }
  }
  const now = new Date()
  return {
    endClientId: "",
    resourceId: resources[0]?.id ?? "",
    date: toDateInputValue(now.toISOString()),
    time: "19:00",
    durationMin: 90,
    status: "confirmed",
    paymentStatus: "pending",
    price: 11000,
  }
}

interface BookingFormDialogProps {
  open: boolean
  booking: EnrichedBooking | null
  clients: EndClient[]
  resources: Resource[]
  locations: Location[]
  onClose: () => void
  onSubmit: (draft: BookingDraft) => void
}

export function BookingFormDialog({
  open,
  booking,
  clients,
  resources,
  locations,
  onClose,
  onSubmit,
}: BookingFormDialogProps) {
  const isEdit = booking !== null
  const [form, setForm] = useState<FormState>(() => initialState(booking, resources))

  // Reset the form whenever the dialog opens for a different booking.
  useEffect(() => {
    if (open) setForm(initialState(booking, resources))
  }, [open, booking, resources])

  const locationOf = useMemo(() => {
    const selected = resources.find((r) => r.id === form.resourceId)
    return locations.find((l) => l.id === selected?.locationId) ?? null
  }, [form.resourceId, resources, locations])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid = form.endClientId !== "" && form.resourceId !== "" && form.date !== ""

  function handleSubmit() {
    if (!isValid || !locationOf) return
    const startsAt = combineDateTimeISO(form.date, form.time)
    const draft: BookingDraft = {
      id: booking?.id ?? tempId("bk"),
      resourceId: form.resourceId,
      locationId: locationOf.id,
      endClientId: form.endClientId,
      startsAt,
      endsAt: addMinutesISO(startsAt, form.durationMin),
      status: form.status,
      source: booking?.source ?? "backoffice_manual",
      price: Number(form.price) || 0,
      paymentStatus: form.paymentStatus,
    }
    onSubmit(draft)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar reserva" : "Nueva reserva"}
      description={
        isEdit
          ? "Modificá los datos del turno."
          : "Cargá una reserva manual desde el mostrador."
      }
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={!isValid}>
            {isEdit ? "Guardar cambios" : "Crear reserva"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-client">Cliente</Label>
          <Select
            id="form-client"
            value={form.endClientId}
            onChange={(e) => set("endClientId", e.target.value)}
          >
            <option value="" disabled>
              Elegí un cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} · {c.phone}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-resource">Cancha</Label>
          <Select
            id="form-resource"
            value={form.resourceId}
            onChange={(e) => set("resourceId", e.target.value)}
          >
            <option value="" disabled>
              Elegí una cancha
            </option>
            {resources.map((r) => {
              const loc = locations.find((l) => l.id === r.locationId)
              return (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {loc && locations.length > 1 ? ` — ${loc.name}` : ""}
                </option>
              )
            })}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-date">Fecha</Label>
            <Input
              id="form-date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-time">Hora</Label>
            <Input
              id="form-time"
              type="time"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-duration">Duración</Label>
            <Select
              id="form-duration"
              value={String(form.durationMin)}
              onChange={(e) => set("durationMin", Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-status">Estado</Label>
            <Select
              id="form-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as BookingStatus)}
            >
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-payment">Pago</Label>
            <Select
              id="form-payment"
              value={form.paymentStatus}
              onChange={(e) => set("paymentStatus", e.target.value as PaymentStatus)}
            >
              {PAYMENT_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_META[p]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-price">Precio</Label>
            <Input
              id="form-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="font-mono tabular-nums"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
