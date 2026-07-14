"use client"

// app/onboarding/page.tsx
//
// A donde redirige app/auth/confirm/route.ts después de provisionar el
// negocio. Usa los componentes de components/ui/* (a diferencia de
// /login y /signup, que se dejan sin estilizar a propósito para Sprint 8) —
// esta pantalla es parte del flujo "adentro del backoffice", no de auth.

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completeOnboardingAction } from "@/lib/actions/onboarding"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const RESOURCE_TYPES = [
  { value: "court", label: "Cancha" },
  { value: "room", label: "Sala" },
  { value: "seat", label: "Puesto / silla" },
  { value: "table", label: "Mesa" },
  { value: "other", label: "Otro" },
]

interface ResourceDraft {
  name: string
  type: string
  capacity: number
  openTime: string
  closeTime: string
  slotDurationMin: number
  price: number
}

function emptyResource(): ResourceDraft {
  return {
    name: "",
    type: "court",
    capacity: 1,
    openTime: "08:00",
    closeTime: "23:00",
    slotDurationMin: 60,
    price: 0,
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [locationName, setLocationName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")

  const [resources, setResources] = useState<ResourceDraft[]>([emptyResource()])

  function updateResource(index: number, patch: Partial<ResourceDraft>) {
    setResources((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addResource() {
    setResources((prev) => [...prev, emptyResource()])
  }

  function removeResource(index: number) {
    setResources((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await completeOnboardingAction({
        location: { name: locationName, address, city, phone, whatsappNumber },
        resources,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.push("/dashboard")
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold">Dejá todo listo para operar</h1>
        <p className="text-sm text-muted-foreground">
          Una sede y al menos un recurso — el resto (horarios finos, precios por franja,
          más sedes) lo ajustás después desde Configuración y Recursos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tu primera sede</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="loc-name">Nombre</Label>
              <Input
                id="loc-name"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Sede Centro"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="loc-address">Dirección</Label>
              <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="loc-city">Ciudad</Label>
              <Input id="loc-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="loc-phone">Teléfono</Label>
              <Input id="loc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="loc-whatsapp">WhatsApp</Label>
              <Input
                id="loc-whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recursos (canchas, salas, mesas...)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {resources.map((resource, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Recurso {index + 1}
                  </span>
                  {resources.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                    >
                      Quitar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="col-span-2 space-y-1">
                    <Label>Nombre</Label>
                    <Input
                      required
                      value={resource.name}
                      onChange={(e) => updateResource(index, { name: e.target.value })}
                      placeholder="Cancha 1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Select
                      value={resource.type}
                      onChange={(e) => updateResource(index, { type: e.target.value })}
                    >
                      {RESOURCE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Capacidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={resource.capacity}
                      onChange={(e) => updateResource(index, { capacity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Abre</Label>
                    <Input
                      type="time"
                      value={resource.openTime}
                      onChange={(e) => updateResource(index, { openTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Cierra</Label>
                    <Input
                      type="time"
                      value={resource.closeTime}
                      onChange={(e) => updateResource(index, { closeTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Turno (min)</Label>
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={resource.slotDurationMin}
                      onChange={(e) =>
                        updateResource(index, { slotDurationMin: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Precio base (ARS)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={resource.price}
                      onChange={(e) => updateResource(index, { price: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addResource} className="w-fit">
              + Agregar recurso
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? "Creando..." : "Terminar y entrar al backoffice"}
        </Button>
      </form>
    </div>
  )
}
