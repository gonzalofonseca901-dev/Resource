"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"
import type { RecurringBooking } from "@/lib/types"

type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateRecurringPaths() {
  revalidatePath("/turnos-fijos")
  revalidatePath("/dashboard")
}

export async function createRecurringSeriesAction(
  draft: RecurringBooking,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.RECURRING_MANAGE)) {
    return { ok: false, error: "No tenés permiso para crear turnos fijos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("recurring_bookings").insert({
    resource_id: draft.resourceId,
    end_client_id: draft.endClientId,
    day_of_week: draft.dayOfWeek,
    start_time: draft.startTime,
    end_time: draft.endTime,
    valid_from: draft.validFrom,
    valid_until: draft.validUntil ?? null,
    status: draft.status,
    price: draft.price ?? null,
    created_by: user.id,
  })

  if (error) {
    // El trigger de anti-solape (002) lanza esta excepción a mano.
    const message = error.message.includes("se superpone")
      ? "Ya existe un turno fijo que se superpone en ese día y horario."
      : `No se pudo crear el turno fijo: ${error.message}`
    return { ok: false, error: message }
  }

  revalidateRecurringPaths()
  return { ok: true }
}

export async function cancelRecurringSeriesAction(seriesId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.RECURRING_MANAGE)) {
    return { ok: false, error: "No tenés permiso para dar de baja turnos fijos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("recurring_bookings")
    .update({ status: "cancelled" })
    .eq("id", seriesId)

  if (error) return { ok: false, error: `No se pudo dar de baja el turno fijo: ${error.message}` }

  revalidateRecurringPaths()
  return { ok: true }
}

export async function cancelRecurringOccurrenceAction(
  seriesId: string,
  date: string,
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.RECURRING_MANAGE)) {
    return { ok: false, error: "No tenés permiso para dar de baja turnos fijos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("booking_exceptions").insert({
    recurring_booking_id: seriesId,
    exception_date: date,
    type: "cancelled",
    created_by: user.id,
  })

  if (error) {
    const message = error.code === "23505" // unique(recurring_booking_id, exception_date)
      ? "Esa fecha ya estaba cancelada para este turno fijo."
      : `No se pudo cancelar esa fecha: ${error.message}`
    return { ok: false, error: message }
  }

  revalidateRecurringPaths()
  return { ok: true }
}
