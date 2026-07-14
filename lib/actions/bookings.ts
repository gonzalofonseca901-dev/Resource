"use server"

// Server Actions para bookings. Chequean el permiso explícitamente ANTES de
// tocar la DB (no solo confiar en RLS) — así el usuario ve un mensaje claro
// ("no tenés permiso") en vez de un error crudo de Postgres, aunque RLS
// (migración 008) igual bloquearía la escritura si alguien se saltea esto.

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"
import type { Booking } from "@/lib/types"

type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateBookingPaths() {
  revalidatePath("/reservas")
  revalidatePath("/agenda")
  revalidatePath("/dashboard")
  revalidatePath("/clientes")
}

/** El EXCLUDE constraint anti-overbooking (002) devuelve 23P01 si se superpone. */
function mapBookingError(error: { message: string; code?: string }): string {
  if (error.code === "23P01") {
    return "Ese horario ya está ocupado para este recurso. Elegí otro horario."
  }
  return `No se pudo guardar la reserva: ${error.message}`
}

export async function createBookingAction(draft: Booking): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.BOOKING_CREATE)) {
    return { ok: false, error: "No tenés permiso para crear reservas." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("bookings").insert({
    resource_id: draft.resourceId,
    end_client_id: draft.endClientId,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt,
    status: draft.status,
    source: draft.source,
    price: draft.price,
    payment_status: draft.paymentStatus,
    created_by: user.id,
  })

  if (error) return { ok: false, error: mapBookingError(error) }

  revalidateBookingPaths()
  return { ok: true }
}

export async function updateBookingAction(draft: Booking): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.BOOKING_UPDATE) && !can(user, PERMISSIONS.BOOKING_CANCEL)) {
    return { ok: false, error: "No tenés permiso para editar reservas." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("bookings")
    .update({
      resource_id: draft.resourceId,
      end_client_id: draft.endClientId,
      starts_at: draft.startsAt,
      ends_at: draft.endsAt,
      status: draft.status,
      price: draft.price,
      payment_status: draft.paymentStatus,
    })
    .eq("id", draft.id)

  if (error) return { ok: false, error: mapBookingError(error) }

  revalidateBookingPaths()
  return { ok: true }
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.BOOKING_CANCEL)) {
    return { ok: false, error: "No tenés permiso para cancelar reservas." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq("id", bookingId)

  if (error) return { ok: false, error: mapBookingError(error) }

  revalidateBookingPaths()
  return { ok: true }
}
