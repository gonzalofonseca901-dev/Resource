"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"
import type { Resource, ResourcePricing, Schedule } from "@/lib/types"

type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateResourcePaths() {
  revalidatePath("/recursos")
  revalidatePath("/agenda")
  revalidatePath("/reservas")
}

async function requireResourceManage() {
  const user = await getCurrentUser()
  if (!user) return { user: null, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.RESOURCE_MANAGE)) {
    return { user: null, error: "No tenés permiso para gestionar recursos." }
  }
  return { user, error: null }
}

// ---------------------------------------------------------------------------
// Recurso (CRUD + activar/desactivar)
// ---------------------------------------------------------------------------

export async function createResourceAction(draft: Omit<Resource, "id">): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()
  const { error } = await supabase.from("resources").insert({
    location_id: draft.locationId,
    name: draft.name,
    type: draft.type,
    description: draft.description || null,
    capacity: draft.capacity,
    is_active: draft.isActive,
  })

  if (error) return { ok: false, error: `No se pudo crear el recurso: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}

export async function updateResourceAction(draft: Resource): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()
  const { error } = await supabase
    .from("resources")
    .update({
      name: draft.name,
      type: draft.type,
      description: draft.description || null,
      capacity: draft.capacity,
      location_id: draft.locationId,
    })
    .eq("id", draft.id)

  if (error) return { ok: false, error: `No se pudo guardar el recurso: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}

export async function toggleResourceActiveAction(
  resourceId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()
  const { error } = await supabase
    .from("resources")
    .update({ is_active: isActive })
    .eq("id", resourceId)

  if (error) return { ok: false, error: `No se pudo actualizar el recurso: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Horarios semanales — se guardan todos juntos (delete + insert), no hay
// unique constraint en (resource_id, day_of_week) que permita un upsert limpio.
// ---------------------------------------------------------------------------

export async function saveSchedulesAction(
  resourceId: string,
  schedules: Schedule[],
): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from("schedules")
    .delete()
    .eq("resource_id", resourceId)
  if (deleteError) {
    return { ok: false, error: `No se pudieron guardar los horarios: ${deleteError.message}` }
  }

  const rows = schedules
    .filter((s) => s.isActive)
    .map((s) => ({
      resource_id: resourceId,
      day_of_week: s.dayOfWeek,
      open_time: s.openTime,
      close_time: s.closeTime,
      slot_duration_min: s.slotDurationMin,
      is_active: true,
    }))

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("schedules").insert(rows)
    if (insertError) {
      return { ok: false, error: `No se pudieron guardar los horarios: ${insertError.message}` }
    }
  }

  revalidateResourcePaths()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Precios — CRUD por regla individual
// ---------------------------------------------------------------------------

export async function upsertPricingRuleAction(
  resourceId: string,
  rule: ResourcePricing,
): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()
  const payload = {
    resource_id: resourceId,
    rule_type: rule.ruleType,
    day_of_week: rule.ruleType === "day_of_week" ? rule.dayOfWeek : null,
    from_time: rule.ruleType === "time_range" ? rule.fromTime : null,
    to_time: rule.ruleType === "time_range" ? rule.toTime : null,
    specific_date: rule.ruleType === "specific_date" ? rule.specificDate : null,
    price: rule.price,
    currency: rule.currency,
    priority: rule.priority,
  }

  // rule.id viene de tempId() del lado del cliente cuando es nueva — no es un
  // UUID real, así que no sirve para decidir insert vs update. Lo resolvemos
  // buscando si existe una fila real con ese id en la base.
  const { data: existing } = await supabase
    .from("resource_pricing")
    .select("id")
    .eq("id", rule.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from("resource_pricing").update(payload).eq("id", rule.id)
    : await supabase.from("resource_pricing").insert(payload)

  if (error) return { ok: false, error: `No se pudo guardar la regla de precio: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}

export async function deletePricingRuleAction(ruleId: string): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()
  const { error } = await supabase.from("resource_pricing").delete().eq("id", ruleId)

  if (error) return { ok: false, error: `No se pudo eliminar la regla: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Bloqueos (mantenimiento / eventos)
// ---------------------------------------------------------------------------

export async function createBlockAction(
  resourceId: string,
  input: { startsAt: string; endsAt: string; reason: string },
): Promise<ActionResult> {
  const { user, error: permError } = await requireResourceManage()
  if (permError || !user) return { ok: false, error: permError ?? "No hay sesión activa." }

  const supabase = await createClient()
  const { error } = await supabase.from("schedule_blocks").insert({
    resource_id: resourceId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    reason: input.reason || null,
    created_by: user.id,
  })

  if (error) return { ok: false, error: `No se pudo crear el bloqueo: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}

export async function deleteBlockAction(blockId: string): Promise<ActionResult> {
  const { error: permError } = await requireResourceManage()
  if (permError) return { ok: false, error: permError }

  const supabase = await createClient()
  const { error } = await supabase.from("schedule_blocks").delete().eq("id", blockId)

  if (error) return { ok: false, error: `No se pudo eliminar el bloqueo: ${error.message}` }
  revalidateResourcePaths()
  return { ok: true }
}
