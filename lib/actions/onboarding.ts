"use server"

// lib/actions/onboarding.ts
//
// V1 simplificado a propósito: un solo submit crea sede + recursos + un
// horario diario (mismo horario los 7 días) + un precio base por recurso.
// No es un wizard de "guardar cada paso por separado" — evita el problema de
// qué pasa si el usuario abandona a mitad de camino con la sede creada pero
// sin recursos. Ajustes más finos (horarios distintos por día, reglas de
// precio por franja/fecha) ya tienen pantalla propia en Recursos
// (resource-schedule-editor.tsx / resource-pricing-editor.tsx) — el wizard
// no necesita cubrir eso, solo dejar algo operativo para arrancar.

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { ok: true } | { ok: false; error: string }

interface OnboardingResourceInput {
  name: string
  type: string
  capacity: number
  openTime: string // "HH:mm"
  closeTime: string
  slotDurationMin: number
  price: number
}

interface OnboardingInput {
  location: {
    name: string
    address: string
    city: string
    phone: string
    whatsappNumber: string
  }
  resources: OnboardingResourceInput[]
}

export async function completeOnboardingAction(input: OnboardingInput): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  // El owner recién provisionado (010_provision_business.sql) ya tiene todos
  // los permisos vía default_role_permissions — este chequeo es más
  // defensivo que estrictamente necesario hoy, pero sigue el mismo criterio
  // que el resto de las actions: nunca asumir que "viene del onboarding" ya
  // implica que está permitido.
  if (!can(user, PERMISSIONS.LOCATION_MANAGE) || !can(user, PERMISSIONS.RESOURCE_MANAGE)) {
    return { ok: false, error: "No tenés permiso para completar el onboarding." }
  }

  if (!input.location.name.trim()) {
    return { ok: false, error: "Falta el nombre de la sede." }
  }
  if (input.resources.length === 0) {
    return { ok: false, error: "Agregá al menos un recurso (cancha, sala, mesa, etc.)." }
  }

  const supabase = await createClient()

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .insert({
      business_id: user.businessId,
      name: input.location.name,
      address: input.location.address || null,
      city: input.location.city || null,
      phone: input.location.phone || null,
      whatsapp_number: input.location.whatsappNumber || null,
      is_active: true,
    })
    .select("id")
    .single()

  if (locationError || !location) {
    return { ok: false, error: `No se pudo crear la sede: ${locationError?.message}` }
  }

  for (const resource of input.resources) {
    const { data: createdResource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        location_id: location.id,
        name: resource.name,
        type: resource.type,
        capacity: resource.capacity,
        is_active: true,
      })
      .select("id")
      .single()

    if (resourceError || !createdResource) {
      return {
        ok: false,
        error: `Sede creada, pero no se pudo crear "${resource.name}": ${resourceError?.message}. Podés agregarlo desde Recursos.`,
      }
    }

    // Mismo horario los 7 días — es el punto de partida, no la única opción;
    // ajustable después desde Recursos > Horarios.
    const scheduleRows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      resource_id: createdResource.id,
      day_of_week: dayOfWeek,
      open_time: resource.openTime,
      close_time: resource.closeTime,
      slot_duration_min: resource.slotDurationMin,
      is_active: true,
    }))

    const { error: scheduleError } = await supabase.from("schedules").insert(scheduleRows)
    if (scheduleError) {
      return {
        ok: false,
        error: `"${resource.name}" se creó sin horarios (${scheduleError.message}). Cargalos desde Recursos.`,
      }
    }

    const { error: pricingError } = await supabase.from("resource_pricing").insert({
      resource_id: createdResource.id,
      rule_type: "base",
      price: resource.price,
      currency: "ARS",
      priority: 0,
    })
    if (pricingError) {
      return {
        ok: false,
        error: `"${resource.name}" se creó sin precio (${pricingError.message}). Cargalo desde Recursos.`,
      }
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/recursos")
  revalidatePath("/agenda")
  revalidatePath("/configuracion")
  return { ok: true }
}