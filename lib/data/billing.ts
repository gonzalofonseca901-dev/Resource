// Billing fetchers — vista del NEGOCIO (owner viendo/eligiendo su propio
// plan). Para el panel de agencia (ve TODOS los negocios), ver lib/data/admin.ts.

import type { Plan, Subscription } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

/** Catálogo público de planes activos, para la pantalla de billing/signup. */
export async function getActivePlans(): Promise<Plan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("plans")
    .select("id, key, name, description, price, currency, billing_frequency, is_active, plan_modules(module_key)")
    .eq("is_active", true)
    .order("sort_order")

  if (error) throw new Error(`No se pudieron cargar los planes: ${error.message}`)

  return (data ?? []).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description ?? "",
    price: Number(p.price),
    currency: p.currency,
    billingFrequency: p.billing_frequency,
    isActive: p.is_active,
    moduleKeys: (p.plan_modules ?? []).map((m: { module_key: string }) => m.module_key),
  }))
}

/** La suscripción del negocio logueado, o null si todavía no tiene una (recién provisionado). */
export async function getMySubscription(): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, business_id, plan_id, status, mp_preapproval_id, current_period_start, current_period_end, grace_until, canceled_at, manual_override, manual_override_note, plans(key, name)",
    )
    .maybeSingle()

  if (error) {
    console.error("[getMySubscription]", error.message)
    return null
  }
  if (!data) return null

  const plan = Array.isArray(data.plans) ? data.plans[0] : data.plans

  return {
    id: data.id,
    businessId: data.business_id,
    planId: data.plan_id,
    planKey: plan?.key ?? "",
    planName: plan?.name ?? "",
    status: data.status,
    mpPreapprovalId: data.mp_preapproval_id,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    graceUntil: data.grace_until,
    canceledAt: data.canceled_at,
    manualOverride: data.manual_override,
    manualOverrideNote: data.manual_override_note,
  }
}
