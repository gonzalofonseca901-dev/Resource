"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Script from "next/script"
import type { ResourcePricing } from "@/lib/types"
import type { PublicThemeConfig } from "@/lib/public-theme"
import { getPublicAvailabilityAction, submitPublicBookingAction } from "@/lib/actions/public-booking"

export interface BookableResource {
  id: string
  name: string
  locationName: string
  timezone: string
  price: ResourcePricing | null
}

interface BookingFlowProps {
  theme: PublicThemeConfig
  resources: BookableResource[]
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function BookingFlow({ theme, resources }: BookingFlowProps) {
  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "")
  const [date, setDate] = useState(todayISODate())
  const [slots, setSlots] = useState<{ slotStart: string; slotEnd: string; isAvailable: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ slotStart: string; slotEnd: string } | null>(null)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  const turnstileRef = useRef<HTMLDivElement>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const selectedResource = resources.find((r) => r.id === resourceId) ?? null

  useEffect(() => {
    if (!resourceId || !date) return
    setLoadingSlots(true)
    setSlotsError(null)
    setSelectedSlot(null)
    getPublicAvailabilityAction(resourceId, date).then((result) => {
      setLoadingSlots(false)
      if (!result.ok) {
        setSlotsError(result.error)
        setSlots([])
        return
      }
      setSlots(result.slots)
    })
  }, [resourceId, date])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!selectedSlot) {
      setSubmitError("Elegí un horario.")
      return
    }
    if (!name.trim() || !phone.trim()) {
      setSubmitError("Completá nombre y teléfono.")
      return
    }

    const turnstileToken = siteKey
      ? (turnstileRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? null)
      : null

    startSubmit(async () => {
      const result = await submitPublicBookingAction({
        resourceId,
        startsAt: selectedSlot.slotStart,
        endsAt: selectedSlot.slotEnd,
        clientName: name,
        clientPhone: phone,
        clientEmail: email,
        price: selectedResource?.price?.price ?? 0,
        turnstileToken,
      })
      if (!result.ok) {
        setSubmitError(result.error)
        return
      }
      setConfirmedBookingId(result.bookingId)
    })
  }

  if (confirmedBookingId) {
    return (
      <div className={`${theme.cardClass} ${theme.radiusClass} flex flex-col gap-2 p-6`}>
        <h2 className={`${theme.headlineClass} text-2xl`}>¡Listo!</h2>
        <p className="opacity-80">
          Reserva recibida para el {new Date(selectedSlot!.slotStart).toLocaleString("es-AR")}. Queda pendiente de
          confirmación del negocio — te van a contactar a {phone}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />}

      {/* Paso 1: recurso */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">¿Dónde?</label>
        <select
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className={`${theme.radiusClass} border border-current/20 bg-transparent px-3 py-2`}
        >
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.locationName} — {r.name}
            </option>
          ))}
        </select>
        {resources.length === 0 && <p className="text-sm opacity-60">Este negocio no tiene recursos cargados todavía.</p>}
      </div>

      {/* Paso 2: fecha */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">¿Cuándo?</label>
        <input
          type="date"
          value={date}
          min={todayISODate()}
          onChange={(e) => setDate(e.target.value)}
          className={`${theme.radiusClass} border border-current/20 bg-transparent px-3 py-2`}
        />
      </div>

      {/* Paso 3: horario */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Horario disponible</label>
        {loadingSlots && <p className="text-sm opacity-60">Buscando horarios...</p>}
        {slotsError && <p className="text-sm text-red-500">{slotsError}</p>}
        {!loadingSlots && !slotsError && slots.length === 0 && (
          <p className="text-sm opacity-60">Sin horarios ese día — probá otra fecha.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => {
            const isSelected = selectedSlot?.slotStart === s.slotStart
            return (
              <button
                key={s.slotStart}
                type="button"
                disabled={!s.isAvailable}
                onClick={() => setSelectedSlot({ slotStart: s.slotStart, slotEnd: s.slotEnd })}
                className={`${theme.radiusClass} border px-3 py-1.5 text-sm transition-colors ${
                  !s.isAvailable
                    ? "cursor-not-allowed border-current/10 opacity-30 line-through"
                    : isSelected
                      ? "border-transparent text-white"
                      : "border-current/20 hover:border-current/40"
                }`}
                style={isSelected ? { backgroundColor: "var(--accent)" } : undefined}
              >
                {new Date(s.slotStart).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </button>
            )
          })}
        </div>
      </div>

      {/* Paso 4: datos de contacto */}
      {selectedSlot && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Tus datos</label>
          <input
            placeholder="Nombre y apellido"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${theme.radiusClass} border border-current/20 bg-transparent px-3 py-2`}
          />
          <input
            placeholder="Teléfono (WhatsApp)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`${theme.radiusClass} border border-current/20 bg-transparent px-3 py-2`}
          />
          <input
            type="email"
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${theme.radiusClass} border border-current/20 bg-transparent px-3 py-2`}
          />

          {siteKey && <div ref={turnstileRef} className="cf-turnstile" data-sitekey={siteKey} />}

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${theme.buttonClass} px-6 py-3 text-sm disabled:opacity-50`}
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {isSubmitting ? "Reservando..." : "Confirmar reserva"}
          </button>
        </div>
      )}
    </form>
  )
}
