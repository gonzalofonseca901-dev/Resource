"use client"

import { useEffect, useState } from "react"
import type { Location, Resource, ResourceType } from "@/lib/types"
import { RESOURCE_TYPE_META } from "@/lib/resource-display"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

// The dialog emits a raw resource draft; `id` is present only when editing.
export type ResourceDraft = Omit<Resource, "id"> & { id?: string }

// Monday-first order not relevant here; types listed in a stable business order.
const TYPE_ORDER: ResourceType[] = ["court", "room", "seat", "table", "other"]

interface FormState {
  name: string
  type: ResourceType
  capacity: number
  locationId: string
  description: string
  isActive: boolean
}

function initialState(resource: Resource | null, locations: Location[]): FormState {
  return {
    name: resource?.name ?? "",
    type: resource?.type ?? "court",
    capacity: resource?.capacity ?? 4,
    locationId: resource?.locationId ?? locations[0]?.id ?? "",
    description: resource?.description ?? "",
    isActive: resource?.isActive ?? true,
  }
}

interface ResourceFormDialogProps {
  open: boolean
  resource: Resource | null
  locations: Location[]
  onClose: () => void
  onSubmit: (draft: ResourceDraft) => void
}

export function ResourceFormDialog({
  open,
  resource,
  locations,
  onClose,
  onSubmit,
}: ResourceFormDialogProps) {
  const [form, setForm] = useState<FormState>(() => initialState(resource, locations))

  useEffect(() => {
    if (open) setForm(initialState(resource, locations))
  }, [open, resource, locations])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid =
    form.name.trim() !== "" && form.locationId !== "" && form.capacity > 0

  function handleSubmit() {
    if (!isValid) return
    const location = locations.find((l) => l.id === form.locationId)
    const draft: ResourceDraft = {
      id: resource?.id,
      businessId: resource?.businessId ?? location?.businessId ?? "",
      locationId: form.locationId,
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      capacity: Number(form.capacity) || 0,
      isActive: form.isActive,
    }
    onSubmit(draft)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={resource ? "Editar recurso" : "Nuevo recurso"}
      description="Datos básicos del recurso. Los horarios y precios se configuran en su ficha."
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={!isValid}>
            {resource ? "Guardar cambios" : "Crear recurso"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="res-name">Nombre</Label>
          <Input
            id="res-name"
            value={form.name}
            placeholder="Cancha 1, Consultorio A…"
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="res-type">Tipo</Label>
            <Select
              id="res-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as ResourceType)}
            >
              {TYPE_ORDER.map((type) => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_META[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="res-capacity">Capacidad</Label>
            <Input
              id="res-capacity"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={form.capacity}
              onChange={(e) => set("capacity", Number(e.target.value) || 0)}
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="res-location">Sede</Label>
          <Select
            id="res-location"
            value={form.locationId}
            onChange={(e) => set("locationId", e.target.value)}
          >
            <option value="" disabled>
              Elegí una sede
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="res-description">Descripción</Label>
          <Textarea
            id="res-description"
            value={form.description}
            placeholder="Piso de cemento, techada, iluminación LED…"
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Recurso activo</span>
            <span className="text-xs text-muted-foreground">
              Los recursos inactivos no aceptan nuevas reservas.
            </span>
          </div>
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => set("isActive", v)}
            aria-label="Recurso activo"
          />
        </div>
      </div>
    </Modal>
  )
}
