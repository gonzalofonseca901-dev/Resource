"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"
import type { BusinessSettings, CancellationPolicy } from "@/lib/types"

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireBusinessSettings() {
  const user = await getCurrentUser()
  if (!user) return { user: null, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.SETTINGS_MANAGE)) {
    return { user: null, error: "No tenés permiso para editar la configuración del negocio." }
  }
  return { user, error: null }
}

export async function updateBusinessInfoAction(input: {
  name: string
  slug: string
  vertical: string
}): Promise<ActionResult> {
  const { user, error: permError } = await requireBusinessSettings()
  if (permError || !user) return { ok: false, error: permError ?? "No hay sesión activa." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("businesses")
    .update({ name: input.name, slug: input.slug, vertical: input.vertical })
    .eq("id", user.businessId)

  if (error) {
    const message = error.code === "23505" ? "Ese identificador (slug) ya está en uso." : error.message
    return { ok: false, error: `No se pudo guardar: ${message}` }
  }

  revalidatePath("/configuracion")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function updateCancellationPolicyAction(
  policy: CancellationPolicy,
): Promise<ActionResult> {
  const { user, error: permError } = await requireBusinessSettings()
  if (permError || !user) return { ok: false, error: permError ?? "No hay sesión activa." }

  const supabase = await createClient()
  const payload = {
    business_id: user.businessId,
    name: "Política estándar",
    hours_before: policy.minHoursBeforeStart,
    // El frontend trabaja en fracción (0-1), la DB en porcentaje (0-100) — ver migración 005.
    penalty_percent: Math.round(policy.lateCancellationFeePercent * 100),
    requires_penalty: policy.lateCancellationFeePercent > 0,
    charge_no_show: policy.chargeNoShow,
    policy_note: policy.policyNote,
    is_default: true,
  }

  const { data: existing } = await supabase
    .from("cancellation_policies")
    .select("id")
    .eq("business_id", user.businessId)
    .eq("is_default", true)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from("cancellation_policies").update(payload).eq("id", existing.id)
    : await supabase.from("cancellation_policies").insert(payload)

  if (error) return { ok: false, error: `No se pudo guardar la política: ${error.message}` }

  revalidatePath("/configuracion")
  return { ok: true }
}

export async function toggleModuleAction(moduleKey: string, enabled: boolean): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.MODULE_MANAGE)) {
    return { ok: false, error: "No tenés permiso para activar/desactivar módulos." }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()
  const { error } = await supabase.from("business_modules").upsert(
    {
      business_id: user.businessId,
      module_key: moduleKey,
      enabled,
      enabled_at: enabled ? now : undefined,
      disabled_at: enabled ? undefined : now,
    },
    { onConflict: "business_id,module_key" },
  )

  if (error) return { ok: false, error: `No se pudo actualizar el módulo: ${error.message}` }

  revalidatePath("/configuracion")
  revalidatePath("/recursos")
  revalidatePath("/turnos-fijos")
  return { ok: true }
}
export async function updateAppearanceAction(
  settings: BusinessSettings,
): Promise<ActionResult> {
  const { user, error: permError } = await requireBusinessSettings()
  if (permError || !user) return { ok: false, error: permError ?? "No hay sesión activa." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("businesses")
    .update({
      settings: {
        theme: settings.theme,
        accentColor: settings.accentColor,
        logoUrl: settings.logoUrl ?? null,
      },
    })
    .eq("id", user.businessId)

  if (error) return { ok: false, error: `No se pudo guardar la apariencia: ${error.message}` }

  revalidatePath("/configuracion")
  return { ok: true }
}
