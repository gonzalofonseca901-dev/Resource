// Business + settings fetchers, implementación real contra Supabase.
//
// NOTA: `businesses.modules_enabled text[]` (columna de 001) quedó como legacy
// desde 003 — la fuente de verdad real de qué módulo está activo por negocio
// es `business_modules.enabled` (join table, permite config por módulo y
// tracking de enabled_at/disabled_at). No se usa la columna vieja acá.

import type { Business, ModuleDefinition } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

/** El negocio del usuario logueado (RLS ya filtra por su business_id). */
export async function getBusiness(): Promise<Business> {
  const supabase = await createClient()

  const [{ data: business, error }, { data: policy }] = await Promise.all([
    supabase.from("businesses").select("*").single(),
    supabase
      .from("cancellation_policies")
      .select("*")
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
