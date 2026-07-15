"use server"

import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createPreapproval } from "@/lib/mercadopago"

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Arranca el checkout de suscripción: crea el preapproval en Mercado Pago y
 * un registro `subscriptions` en estado 'trialing' (todavía sin autorizar
 * del lado de MP) referenciado por mp_preapproval_id. El webhook
 * (app/api/mercadopago/webhook) es quien lo pasa a 'active' cuando MP
 * confirma la autorización — acá solo se dispara el flujo, no se asume éxito.
 *
 * Usa service_role para el insert/upsert porque la policy de `subscriptions`
 * (012) no permite que el negocio escriba su propia fila directo — ver
 * comentario en esa migración. El chequeo de permiso de quién puede
 * suscribir al negocio (SETTINGS_MANAGE, mismo permission que el resto de
 * Configuración) pasa ACÁ, antes de tocar nada con service_role.
 */
export async function startSubscriptionCheckoutAction(
  planId: string,
): Promise<ActionResult<{ initPoint: string }>> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.SETTINGS_MANAGE)) {
    return { ok: false, error: "No tenés permiso para gestionar la suscripción del negocio." }
  }

  const supabase = await createClient()
  const [{ data: business }, { data: plan }] = await Promise.all([
    supabase.from("businesses").select("id, name, email").eq("id", user.businessId).single(),
    supabase.from("plans").select("id, key, name, price, currency, billing_frequency").eq("id", planId).single(),
  ])

  if (!business) return { ok: false, error: "No se pudo resolver el negocio." }
  if (!plan) return { ok: false, error: "El plan seleccionado no existe." }
  if (!business.email) {
    return {
      ok: false,
      error: "El negocio no tiene un email cargado — completalo en Configuración antes de suscribirte (Mercado Pago lo requiere como payer_email).",
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  let preapproval
  try {
    preapproval = await createPreapproval({
      reason: `Recursos — Plan ${plan.name}`,
      payerEmail: business.email,
      amount: Number(plan.price),
      currencyId: plan.currency,
      frequency: 1,
      frequencyType: plan.billing_frequency === "yearly" ? "months" : "months",
      externalReference: business.id,
      backUrl: `${siteUrl}/facturacion`,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error creando la suscripción en Mercado Pago." }
  }

  if (!preapproval.init_point) {
    return { ok: false, error: "Mercado Pago no devolvió el link de autorización. Reintentá en unos minutos." }
  }

  const admin = createServiceClient()
  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      business_id: business.id,
      plan_id: plan.id,
      status: "trialing",
      mp_preapproval_id: preapproval.id,
      mp_payer_email: business.email,
    },
    { onConflict: "business_id" },
  )

  if (upsertError) {
    return { ok: false, error: `Se creó la suscripción en Mercado Pago pero no se pudo registrar acá: ${upsertError.message}. Contactá soporte con el email de pago ${business.email}.` }
  }

  return { ok: true, data: { initPoint: preapproval.init_point } }
}

/**
 * Cancela la suscripción actual. Solo marca `canceled_at`/`status` local —
 * NO llama a la API de cancelación de Mercado Pago todavía (dejar el
 * preapproval "authorized" del lado de MP y cortar acceso acá es más simple
 * para un V1, pero significa que el cobro recurrente en MP seguiría activo
 * hasta cancelarlo a mano en su dashboard). Marcado como pendiente: llamar
 * PUT /preapproval/{id} con status:"cancelled" acá antes de dar esto por
 * completo.
 */
export async function cancelSubscriptionAction(): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.SETTINGS_MANAGE)) {
    return { ok: false, error: "No tenés permiso para cancelar la suscripción." }
  }

  const admin = createServiceClient()
  const { error } = await admin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("business_id", user.businessId)

  if (error) return { ok: false, error: `No se pudo cancelar: ${error.message}` }
  return { ok: true, data: undefined }
}
