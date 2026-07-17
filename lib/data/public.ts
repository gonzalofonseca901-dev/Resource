// Fetchers para la landing pública + reservas web SIN LOGIN (Sprint 7).
// Corren con el cliente normal (createClient()) — un visitante sin cookie de
// sesión pega como rol `anon` en Postgres, y la migración 015 es la que le
// da SELECT a ese rol sobre estas tablas puntuales. No usar service_role
// acá: si estos fetchers necesitaran bypasear RLS para andar, sería señal de
// que la 015 está mal, no una razón para esconder el problema con
// service_role.

import type { Business, Location, Resource, ResourcePricing } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

/** El negocio público por slug (resuelto por el middleware desde el subdominio), o null si no existe. */
export async function getPublicBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = await createClient()

  const { data: business, error } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle()

  if (error) throw new Error(`No se pudo cargar el negocio: ${error.message}`)
  if (!business) return null

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    vertical: business.vertical,
    legalName: business.legal_name ?? "",
    taxId: business.tax_id ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    modulesEnabled: [], // no hace falta acá — la landing no gatea por módulo, eso es un concepto de backoffice
    cancellationPolicy: {
      // cancellation_policies no tiene policy pública en la 015 a
      // propósito — no hace falta mostrarla en la landing todavía
      // (Sprint 10 la va a necesitar para explicar reembolsos de seña).
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

function mapLocation(row: {
  id: string
  business_id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  whatsapp_number: string | null
  timezone: string
  is_active: boolean
}): Location {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    address: row.address ?? "",
    city: row.city ?? "",
    phone: row.phone ?? "",
    whatsappNumber: row.whatsapp_number ?? "",
    timezone: row.timezone,
    isActive: row.is_active,
  }
}

export async function getPublicLocations(businessId: string): Promise<Location[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name")

  if (error) throw new Error(`No se pudieron cargar las sedes: ${error.message}`)
  return (data ?? []).map(mapLocation)
}

export async function getPublicResourcesByLocation(locationId: string): Promise<Resource[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("location_id", locationId)
    .eq("is_active", true)
    .order("name")

  if (error) throw new Error(`No se pudieron cargar los recursos: ${error.message}`)
  return (data ?? []).map((r) => ({
    id: r.id,
    locationId: r.location_id,
    businessId: r.business_id,
    name: r.name,
    type: (r.type as Resource["type"]) ?? "other",
    description: r.description ?? "",
    capacity: r.capacity,
    isActive: r.is_active,
  }))
}

export async function getPublicPricingByResource(resourceId: string): Promise<ResourcePricing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("resource_pricing")
    .select("*")
    .eq("resource_id", resourceId)
    .order("priority", { ascending: false })

  if (error) throw new Error(`No se pudieron cargar los precios: ${error.message}`)
  return (data ?? []).map((p) => ({
    id: p.id,
    resourceId: p.resource_id,
    ruleType: p.rule_type,
    dayOfWeek: p.day_of_week ?? undefined,
    fromTime: p.from_time ?? undefined,
    toTime: p.to_time ?? undefined,
    specificDate: p.specific_date ?? undefined,
    price: Number(p.price),
    currency: p.currency,
    priority: p.priority,
  }))
}

export interface PublicSlot {
  slotStart: string
  slotEnd: string
  isAvailable: boolean
}

/** Disponibilidad calculada para un recurso en una fecha (YYYY-MM-DD), vía la RPC de la migración 015. */
export async function getPublicAvailability(resourceId: string, date: string): Promise<PublicSlot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_public_availability", {
    p_resource_id: resourceId,
    p_date: date,
  })

  if (error) throw new Error(`No se pudo cargar la disponibilidad: ${error.message}`)
  return (data ?? []).map((s: { slot_start: string; slot_end: string; is_available: boolean }) => ({
    slotStart: s.slot_start,
    slotEnd: s.slot_end,
    isAvailable: s.is_available,
  }))
}

/** "Desde $X" para mostrar en la landing — toma la regla de tipo `base` si existe, si no la de mayor prioridad. */
export function cheapestPrice(pricing: ResourcePricing[]): ResourcePricing | null {
  if (pricing.length === 0) return null
  const base = pricing.find((p) => p.ruleType === "base")
  return base ?? pricing[0]
}
