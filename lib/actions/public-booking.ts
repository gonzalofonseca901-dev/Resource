"use server"

// Server Action de la reserva pública (Sprint 7) — es la única puerta de
// entrada desde el cliente hacia create_public_booking(), así que acá es
// donde vive la verificación de Turnstile, no en el RPC (Postgres no puede
// llamar a la API de Cloudflare).

import { createClient } from "@/lib/supabase/server"
import { getPublicAvailability, type PublicSlot } from "@/lib/data/public"

type ActionResult = { ok: true; bookingId: string } | { ok: false; error: string }

/** Wrapper de Server Action — el componente cliente del flujo de reserva no puede llamar a lib/data directo. */
export async function getPublicAvailabilityAction(
  resourceId: string,
  date: string,
): Promise<{ ok: true; slots: PublicSlot[] } | { ok: false; error: string }> {
  try {
    const slots = await getPublicAvailability(resourceId, date)
    return { ok: true, slots }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cargar la disponibilidad." }
  }
}

export async function submitPublicBookingAction(input: {
  resourceId: string
  startsAt: string // ISO
  endsAt: string // ISO
  clientName: string
  clientPhone: string
  clientEmail: string
  price: number
  turnstileToken: string | null
}): Promise<ActionResult> {
  const turnstileError = await verifyTurnstile(input.turnstileToken)
  if (turnstileError) return { ok: false, error: turnstileError }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_public_booking", {
    p_resource_id: input.resourceId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_client_name: input.clientName,
    p_client_phone: input.clientPhone,
    p_client_email: input.clientEmail,
    p_price: input.price,
  })

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, error: "Ese horario se acaba de ocupar. Elegí otro horario." }
    }
    // Los `raise exception` de la función (nombre/teléfono faltante,
    // rate-limit, etc.) llegan acá como error.message tal cual se
    // escribieron en la migración 015 — ya están en español, se muestran
    // directo.
    return { ok: false, error: error.message }
  }

  return { ok: true, bookingId: data as string }
}

/**
 * Verifica el token de Cloudflare Turnstile contra su API. Si
 * `TURNSTILE_SECRET_KEY` no está seteada, deja pasar sin validar — mismo
 * criterio que se usó con Mercado Pago (no bloquea desarrollo, hay que
 * configurarlo antes de exponer esto en producción real). El rate-limit
 * básico dentro de `create_public_booking` (migración 015) sigue activo
 * incluso sin Turnstile configurado, así que no queda completamente
 * abierto — pero no reemplaza a un captcha real contra bots.
 */
async function verifyTurnstile(token: string | null): Promise<string | null> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn("[public-booking] TURNSTILE_SECRET_KEY no seteada — aceptando sin verificar captcha (solo aceptable en desarrollo).")
    return null
  }
  if (!token) return "Falta verificar que no sos un robot. Recargá la página e intentá de nuevo."

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    })
    const result = await res.json()
    if (!result.success) {
      return "No se pudo verificar que no sos un robot. Recargá la página e intentá de nuevo."
    }
    return null
  } catch (err) {
    // Si Cloudflare está caído, mejor no bloquear la reserva por eso —
    // el rate-limit del RPC sigue siendo la red de contención.
    console.error("[public-booking] Error verificando Turnstile:", err)
    return null
  }
}
