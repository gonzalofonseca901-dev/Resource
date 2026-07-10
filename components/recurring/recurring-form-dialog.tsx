"use client"

import { useEffect, useState } from "react"
import type {
  DayOfWeek,
  EndClient,
  Location,
  RecurringBooking,
  Resource,
} from "@/lib/types"
import { formatDayOfWeek } from "@/lib/date-utils"
import { tempId } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// The dialog emits a raw RecurringBooking; the view enriches it.
export type RecurringDraft = RecurringBooking

// Monday-first order for the day picker (values are 0=Sun..6=Sat).
const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

interface FormState {
  endClientId: string
  resourceId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  validFrom: string
  validUntil: string
  price: number
}

function initialState(resources: Resource[]): FormState {
  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`
  return {
    endClientId: "",
    resourceId: resources[0]?.id ?? "",
    dayOfWeek: 1,
    startTime: "20:00",
    endTime: "21:30",
    validFrom: iso,
    validUntil: "",
    price: 11000,
  }
}

interface RecurringFormDialogProps {
  open: boolean
  clients: EndClient[]
  resources: Resource[]
  locations: Location[]
  onClose: () => void
  onSubmit: (draft: RecurringDraft) => void
}

export function RecurringFormDialog({
  open,
  clients,
  resources,
  locations,
  onClose,
  onSubmit,
}: RecurringFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => initialState(resources))

  useEffect(() => {
    if (open) setForm(initialState(resources))
  }, [open, resources])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid =
    form.endClientId !== "" &&
    form.resourceId !== "" &&
    form.startTime !== "" &&
    form.endTime !== "" &&
    form.endTime > form.startTime &&
    form.validFrom !== ""

  function handleSubmit() {
    if (!isValid) return
    const draft: RecurringDraft = {
      id: tempId("rec"),
      resourceId: form.resourceId,
      endClientId: form.endClientId,
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      validFrom: form.validFrom,
      validUntil: form.validUntil || undefined,
      status: "active",
      price: Number(form.price) || 0,
      currency: "ARS",
    }
    onSubmit(draft)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva serie recurrente"
      description="Se repite todas las semanas en el día y horario elegidos."
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={!isValid}>
            Crear serie
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rec-client">Cliente</Label>
          <Select
            id="rec-client"
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
          <Label htmlFor="rec-resource">Cancha</Label>
          <Select
            id="rec-resource"
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

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-day">Día</Label>
            <Select
              id="rec-day"
              value={String(form.dayOfWeek)}
              onChange={(e) => set("dayOfWeek", Number(e.target.value) as DayOfWeek)}
            >
              {DAY_ORDER.map((day) => (
                <option key={day} value={day} className="capitalize">
                  {formatDayOfWeek(day)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-start">Desde</Label>
            <Input
              id="rec-start"
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-end">Hasta</Label>
            <Input
              id="rec-end"
              type="time"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-from">Vigente desde</Label>
            <Input
              id="rec-from"
              type="date"
              value={form.validFrom}
              onChange={(e) => set("validFrom", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-until">Vigente hasta (opcional)</Label>
            <Input
              id="rec-until"
              type="date"
              value={form.validUntil}
              min={form.validFrom || undefined}
              onChange={(e) => set("validUntil", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rec-price">Precio por turno</Label>
          <Input
            id="rec-price"
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
    </Modal>
  )
}
