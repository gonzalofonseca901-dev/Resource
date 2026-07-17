// Business + settings fetchers, implementación real contra Supabase.
//
// NOTA: `businesses.modules_enabled text[]` (columna de 001) quedó como legacy
// desde 003 — la fuente de verdad real de qué módulo está activo por negocio
// es `business_modules.enabled` (join table, permite config por módulo y
// tracking de enabled_at/disabled_at). No se usa la columna vieja acá.

import type { Business, ModuleDefinition } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/data/session"

/**
 * El negocio del usuario logueado.
 *
 * BUG REAL encontrado validando Sprint 6 (dejar documentado, mismo criterio
 * que el checklist de Sprint 5): esta función hacía
 * `.from("businesses").select("*").single()` SIN `.eq("id", ...)`,
 * confiando en que RLS siempre iba a devolver exactamente 1 fila (la del
 * negocio del usuario). Eso era cierto para cualquier usuario normal, pero
 * dejó de serlo para un agency admin desde la migración 011: la policy
 * `agency_admin_select_businesses` le da SELECT sobre TODOS los negocios, así
 * que `.single()` sobre la tabla entera pasó a fallar con
 * "Cannot coerce the result to a single JSON object" apenas el usuario
 * logueado tuvo `is_agency_admin = true` — no es un bug de la migración 011
 * en sí, es esta función asumiendo que RLS iba a hacer un trabajo de scoping
 * que en realidad nunca le pedía explícitamente. Fix: filtrar por
 * `business_id` a mano, igual que ya hacen el resto de los fetchers del
 * repo — no depender de que la ausencia de un `.eq()` "da lo mismo" porque
 * RLS lo resuelve.
 */
export async function getBusiness(): Promise<Business> {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No se pudo cargar el negocio: no hay sesión activa.")
  }

  const [{ data: business, error }, { data: policy }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", currentUser.businessId).single(),
    supabase
      .from("cancellation_policies")
      .select("*")
      .eq("business_id", currentUser.businessId)
      .eq("is_default", true)
      .maybeSingle(),
  ])

  if (error || !business) {
    throw new Error(`No se pudo cargar el negocio: ${error?.message ?? "sin datos"}`)
  }

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    vertical: business.vertical,
    legalName: business.legal_name ?? "",
    taxId: business.tax_id ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    modulesEnabled: await getEnabledModuleKeys(business.id),
    cancellationPolicy: policy
      ? {
          minHoursBeforeStart: policy.hours_before,
          // DB guarda 0-100, el frontend trabaja internamente en 0-1 (el form
          // ya hace *100 para mostrarlo) — ver migración 005.
          lateCancellationFeePercent: (policy.penalty_percent ?? 0) / 100,
          chargeNoShow: policy.charge_no_show,
          policyNote: policy.policy_note ?? "",
        }
      : {
          // Sin política default cargada todavía (negocio recién creado).
          minHoursBeforeStart: 24,
          lateCancellationFeePercent: 0,
          chargeNoShow: false,
          policyNote: "",
        },
    settings: {
      theme: business.settings?.theme ?? "court",
      accentColor: business.settings?.accentColor ?? "#147D7A",
      logoUrl: business.settings?.logoUrl,
    },
  }
}

async function getEnabledModuleKeys(businessId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("business_modules")
    .select("module_key")
    .eq("business_id", businessId)
    .eq("enabled", true)

  return (data ?? []).map((r) => r.module_key)
}

/** Catálogo completo de módulos que ofrece la plataforma (no depende del negocio). */
export async function getModuleCatalog(): Promise<ModuleDefinition[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("modules")
    .select("key, name, description, is_core")
    .order("key")

  if (error) throw new Error(`No se pudo cargar el catálogo de módulos: ${error.message}`)

  return (data ?? []).map((m) => ({
    key: m.key,
    name: m.name,
    description: m.description ?? "",
    required: m.is_core,
  }))
}