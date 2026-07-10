"use client"

import { useEffect, useState } from "react"
import { MapPin, Pencil, Plus } from "lucide-react"
import type { Location } from "@/lib/types"
import { tempId } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface LocationDraft {
  id?: string
  name: string
  address: string
  city: string
  phone: string
  whatsappNumber: string
  isActive: boolean
}

function emptyDraft(): LocationDraft {
  return {
    name: "",
    address: "",
    city: "",
    phone: "",
    whatsappNumber: "",
    isActive: true,
  }
}

function toDraft(location: Location): LocationDraft {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    phone: location.phone,
    whatsappNumber: location.whatsappNumber,
    isActive: location.isActive,
  }
}

interface LocationsManagerProps {
  businessId: string
  locations: Location[]
  canManage: boolean
}

export function LocationsManager({ businessId, locations: initial, canManage }: LocationsManagerProps) {
  const [locations, setLocations] = useState<Location[]>(initial)
  const [draft, setDraft] = useState<LocationDraft | null>(null)

  const isValid = draft != null && draft.name.trim() !== "" && draft.city.trim() !== ""

  function save() {
    if (!draft || !isValid) return
    setLocations((prev) => {
      if (draft.id) {
        return prev.map((l) => (l.id === draft.id ? { ...l, ...draft, id: draft.id! } : l))
      }
      const created: Location = {
        id: tempId("loc"),
        businessId,
        name: draft.name.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        phone: draft.phone.trim(),
        whatsappNumber: draft.whatsappNumber.trim(),
        timezone: "America/Argentina/Buenos_Aires",
        isActive: draft.isActive,
      }
      return [...prev, created]
    })
    setDraft(null)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Sedes</CardTitle>
          <p className="text-xs text-muted-foreground">
            Sucursales donde operás. Cada recurso pertenece a una sede.
          </p>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setDraft(emptyDraft())}>
            <Plus className="size-3.5" aria-hidden="true" />
            Nueva sede
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {locations.map((location) => (
            <li
              key={location.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{location.name}</span>
                  {location.isActive ? (
                    <Badge tone="success">Activa</Badge>
                  ) : (
                    <Badge tone="muted">Inactiva</Badge>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" aria-hidden="true" />
                  {location.address ? `${location.address}, ` : ""}
                  {location.city}
                </span>
              </div>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${location.name}`}
                  onClick={() => setDraft(toDraft(location))}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <LocationDialog
        draft={draft}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSave={save}
        canSave={isValid}
      />
    </Card>
  )
}

interface LocationDialogProps {
  draft: LocationDraft | null
  onChange: (draft: LocationDraft) => void
  onClose: () => void
  onSave: () => void
  canSave: boolean
}

function LocationDialog({ draft, onChange, onClose, onSave, canSave }: LocationDialogProps) {
  // Keep a stable local copy so inputs stay controlled while the modal is open.
  const [local, setLocal] = useState<LocationDraft>(draft ?? emptyDraft())
  useEffect(() => {
    if (draft) setLocal(draft)
  }, [draft])

  function set<K extends keyof LocationDraft>(key: K, value: LocationDraft[K]) {
    const next = { ...local, [key]: value }
    setLocal(next)
    onChange(next)
  }

  return (
    <Modal
      open={draft !== null}
      onClose={onClose}
      title={draft?.id ? "Editar sede" : "Nueva sede"}
      description="Datos de contacto y ubicación de la sucursal."
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="lg" onClick={onSave} disabled={!canSave}>
            {draft?.id ? "Guardar" : "Crear sede"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="loc-name">Nombre</Label>
          <Input id="loc-name" value={local.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-address">Dirección</Label>
            <Input id="loc-address" value={local.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-city">Ciudad</Label>
            <Input id="loc-city" value={local.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-phone">Teléfono</Label>
            <Input id="loc-phone" value={local.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-wa">WhatsApp</Label>
            <Input id="loc-wa" value={local.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Sede activa</span>
            <span className="text-xs text-muted-foreground">Las sedes inactivas no aparecen en el sitio público.</span>
          </div>
          <Switch checked={local.isActive} onCheckedChange={(v) => set("isActive", v)} aria-label="Sede activa" />
        </div>
      </div>
    </Modal>
  )
}
