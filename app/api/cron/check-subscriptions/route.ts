// app/api/cron/check-subscriptions/route.ts
//
// Barrido diario (ver vercel.json) que aplica la política de mora asumida en
// la migración 012: suscripciones en 'past_due' cuyo `grace_until` ya pasó
// se degradan a 'suspended' y pierden los módulos no-core. `manual_override`
// las excluye (cortesías/casos especiales desde el panel de agencia).
//
// Protegido con CRON_SECRET (header Authorization: Bearer <secret>) — mismo
// patrón que recomienda Vercel Cron para no dejar la ruta abierta a
// cualquiera que la adivine.

import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const admin = createServiceClient()
  const nowIso = new Date().toISOString()

  const { data: overdue, error } = await admin
    .from("subscriptions")
    .select("id, business_id")
    .eq("status", "past_due")
    .eq("manual_override", false)
    .lt("grace_until", nowIso)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let suspended = 0
  for (const sub of overdue ?? []) {
    await admin.from("subscriptions").update({ status: "suspended" }).eq("id", sub.id)

    // Degradar módulos: apagar todo lo no-core. No hay un "apply_core_only"
    // en SQL todavía (solo apply_plan_modules, que habilita) — se hace acá
    // en dos pasos explícitos en vez de agregar otra función a la migración
    // 012 ya escrita.
    const { data: modules } = await admin.from("modules").select("key, is_core")
    const nonCoreKeys = (modules ?? []).filter((m) => !m.is_core).map((m) => m.key)
    if (nonCoreKeys.length > 0) {
      await admin
        .from("business_modules")
        .update({ enabled: false, disabled_at: nowIso })
        .eq("business_id", sub.business_id)
        .in("module_key", nonCoreKeys)
    }
    suspended++
  }

  return NextResponse.json({ ok: true, suspended })
}
