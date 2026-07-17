// app/api/mercadopago/webhook/route.ts
//
// Recibe notificaciones de Mercado Pago para la suscripción SaaS
// (negocio → plataforma, Sprint 6 Parte A). NO tiene nada que ver con
// Split Payments (Sprint 10) — ese webhook, cuando exista, va a ser otra
// ruta separada a propósito (dos integraciones de MP distintas, ver
// context pack).
//
// MP puede mandar dos formatos históricos de notificación (`type`/`data.id`
// el nuevo, `topic`/`resource` el viejo) y puede reenviar el mismo evento
// más de una vez — por eso `subscription_events.mp_event_id` es UNIQUE y acá
// se chequea antes de procesar (idempotencia).
//
// VALIDACIÓN DE FIRMA: implementada siguiendo el esquema documentado por MP
// (header `x-signature`: "ts=...,v1=...", HMAC-SHA256 de un manifest con el
// id del recurso + el ts, usando MERCADOPAGO_WEBHOOK_SECRET). Si esa env var
// no está seteada, el webhook igual procesa la notificación (mejor recibir
// el pago que bloquear todo por falta de config en un ambiente de
// desarrollo) pero loguea una advertencia — sacar ese fallback antes de
// producción real con plata de por medio.

import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { createServiceClient } from "@/lib/supabase/service"
import { getPreapproval, getPayment } from "@/lib/mercadopago"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const url = new URL(request.url)

  const signatureHeader = request.headers.get("x-signature")
  const requestId = request.headers.get("x-request-id")
  const dataIdFromQuery = url.searchParams.get("data.id") ?? url.searchParams.get("id")

  if (!verifySignature(signatureHeader, requestId, dataIdFromQuery)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 })
  }

  let payload: any
  try {
    payload = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    payload = {}
  }

  // Formato nuevo: { type: "payment" | "subscription_preapproval", data: { id } }
  // Formato viejo (query params): ?topic=payment&id=...
  const eventType: string = payload.type ?? url.searchParams.get("topic") ?? "unknown"
  const resourceId: string | null = payload.data?.id ?? dataIdFromQuery
  const mpEventId: string = payload.id ? String(payload.id) : `${eventType}:${resourceId}`

  const admin = createServiceClient()

  // Idempotencia: si ya procesamos este evento, respondemos 200 sin repetir trabajo.
  const { data: existingEvent } = await admin
    .from("subscription_events")
    .select("id, processed_at")
    .eq("mp_event_id", mpEventId)
    .maybeSingle()

  if (existingEvent?.processed_at) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  if (!resourceId) {
    return NextResponse.json({ ok: true, ignored: "sin resource id" })
  }

  try {
    if (eventType === "subscription_preapproval" || eventType === "preapproval") {
      await handlePreapprovalEvent(admin, resourceId, payload)
    } else if (eventType === "payment") {
      await handlePaymentEvent(admin, resourceId, payload)
    }
    // Otros types (subscription_authorized_payment, etc.) se ignoran por ahora
    // a propósito — no afectan el status que usamos (active/past_due).

    await admin.from("subscription_events").upsert(
      {
        mp_event_id: mpEventId,
        mp_event_type: eventType,
        mp_action: payload.action ?? null,
        raw_payload: payload,
        processed_at: new Date().toISOString(),
      },
      { onConflict: "mp_event_id" },
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido procesando el webhook."
    console.error("[mercadopago webhook]", message)
    await admin.from("subscription_events").upsert(
      {
        mp_event_id: mpEventId,
        mp_event_type: eventType,
        mp_action: payload.action ?? null,
        raw_payload: payload,
        processing_error: message,
      },
      { onConflict: "mp_event_id" },
    )
    // 200 igual: si devolvemos error, MP reintenta indefinidamente el mismo
    // evento roto. Queda registrado en processing_error para revisar a mano.
    return NextResponse.json({ ok: false, error: message })
  }
}

async function handlePreapprovalEvent(admin: ReturnType<typeof createServiceClient>, preapprovalId: string, _payload: any) {
  const preapproval = await getPreapproval(preapprovalId)

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id, plan_id, status, business_id")
    .eq("mp_preapproval_id", preapprovalId)
    .maybeSingle()

  if (!subscription) {
    console.warn("[mercadopago webhook] preapproval sin subscription local:", preapprovalId)
    return
  }

  const nextStatus = mapPreapprovalStatus(preapproval.status)
  const now = new Date()
  const periodEnd = new Date(now)
  // BUG REAL corregido junto con lib/actions/billing.ts: antes sumaba 1 mes
  // fijo sin importar la frecuencia real del plan. Un plan anual
  // (frequency=12) recién iba a "vencer" localmente al mes, aunque
  // Mercado Pago solo fuera a cobrar de nuevo a los 12. Se usa
  // `preapproval.auto_recurring` (lo que MP confirma que quedó configurado)
  // en vez de volver a mirar `plans.billing_frequency` acá — es la fuente
  // de verdad más directa en el momento del webhook.
  const frequencyMonths = preapproval.auto_recurring?.frequency ?? 1
  periodEnd.setMonth(periodEnd.getMonth() + frequencyMonths)

  await admin
    .from("subscriptions")
    .update({
      status: nextStatus,
      current_period_start: nextStatus === "active" ? now.toISOString() : undefined,
      current_period_end: nextStatus === "active" ? periodEnd.toISOString() : undefined,
      grace_until: nextStatus === "past_due" ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
    })
    .eq("id", subscription.id)

  if (nextStatus === "active") {
    await admin.rpc("apply_plan_modules", {
      p_business_id: subscription.business_id,
      p_plan_id: subscription.plan_id,
    })
  }
}

async function handlePaymentEvent(admin: ReturnType<typeof createServiceClient>, paymentId: string, _payload: any) {
  const payment = await getPayment(paymentId)
  if (!payment.external_reference) return

  // external_reference en el preapproval es el business_id (ver
  // lib/actions/billing.ts) — lo usamos para encontrar la suscripción cuando
  // el evento es de un pago individual, no del preapproval en sí.
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id")
    .eq("business_id", payment.external_reference)
    .maybeSingle()

  if (!subscription) return

  if (payment.status === "rejected") {
    await admin
      .from("subscriptions")
      .update({
        status: "past_due",
        grace_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", subscription.id)
  }
  // status === "approved" no hace falta manejarlo acá: el evento de
  // preapproval (authorized) ya deja status='active'. Este handler cubre
  // sobre todo el caso de rechazo de un cobro recurrente posterior.
}

function mapPreapprovalStatus(mpStatus: string): "active" | "past_due" | "canceled" | "trialing" {
  switch (mpStatus) {
    case "authorized":
      return "active"
    case "paused":
      return "past_due"
    case "cancelled":
      return "canceled"
    default:
      return "trialing"
  }
}

function verifySignature(signatureHeader: string | null, requestId: string | null, dataId: string | null): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[mercadopago webhook] MERCADOPAGO_WEBHOOK_SECRET no seteado — aceptando sin validar firma (solo aceptable en desarrollo).")
    return true
  }
  if (!signatureHeader || !dataId) return false

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=")
      return [k?.trim(), v?.trim()]
    }),
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  } catch {
    return false
  }
}
