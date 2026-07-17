"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Todo Server Action de este archivo empieza revalidando is_agency_admin del
 * caller ACÁ (con el cliente normal, respetando RLS/sesión real) antes de
 * pasar a service_role para escribir. No alcanza con que la ruta esté bajo
 * app/(admin) — ese layout ya redirige a quien no es admin, pero un Server
 * Action se puede invocar directo sin pasar por el layout que lo envuelve
 * (mismo criterio de "no confiar en una sola capa" que el resto del repo).
 */
async function requireAgencyAdmin() {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: "No hay sesión activa." }
  if (!user.isAgencyAdmin) return { ok: false as const, error: "No tenés acceso al panel de agencia." }
  return { ok: true as const, user }
}

export async function changeBusinessPlanAction(
  businessId: string,
  planId: string,
  note?: string,
): Promise<ActionResult> {
  const auth = await requireAgencyAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const admin = createServiceClient()

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      business_id: businessId,
      plan_id: planId,
      status: "active",
      manual_override: true,
      manual_override_note: note ?? "Cambio de plan manual desde el panel de agencia.",
      current_period_start: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  )
  if (upsertError) return { ok: false, error: `No se pudo cambiar el plan: ${upsertError.message}` }

  const { error: applyError } = await admin.rpc("apply_plan_modules", {
    p_business_id: businessId,
    p_plan_id: planId,
  })
  if (applyError) {
    return {
      ok: false,
      error: `El plan se cambió pero no se pudieron aplicar los módulos: ${applyError.message}. Revisalo a mano en el detalle del negocio.`,
    }
  }

  revalidatePath(`/negocios/${businessId}`)
  revalidatePath("/negocios")
  return { ok: true, data: undefined }
}

/** Activar/desactivar un módulo puntual de un negocio ajeno — override manual desde soporte. */
export async function toggleBusinessModuleAction(
  businessId: string,
  moduleKey: string,
  enabled: boolean,
): Promise<ActionResult> {
  const auth = await requireAgencyAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const admin = createServiceClient()
  const now = new Date().toISOString()
  const { error } = await admin.from("business_modules").upsert(
    {
      business_id: businessId,
      module_key: moduleKey,
      enabled,
      enabled_at: enabled ? now : undefined,
      disabled_at: enabled ? undefined : now,
    },
    { onConflict: "business_id,module_key" },
  )
  if (error) return { ok: false, error: `No se pudo actualizar el módulo: ${error.message}` }

  revalidatePath(`/negocios/${businessId}`)
  return { ok: true, data: undefined }
}

/**
 * Extiende invite-user (Edge Function ya existente) para invitar a un negocio
 * AJENO — pasa `businessId` explícito en el body. La función valida del lado
 * de ella que quien llama sea agency admin cuando el business_id no coincide
 * con el propio (ver comentario a agregar en supabase/functions/invite-user).
 */
export async function inviteUserToBusinessAction(input: {
  businessId: string
  email: string
  fullName: string
  roleId: string
}): Promise<ActionResult> {
  const auth = await requireAgencyAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: { ...input, targetBusinessId: input.businessId },
  })
  if (error) return { ok: false, error: `No se pudo invitar: ${error.message}` }
  if (data?.error) return { ok: false, error: data.error }

  revalidatePath(`/negocios/${input.businessId}`)
  return { ok: true, data: undefined }
}

/**
 * Dispara una sesión de impersonación real: genera un magic link para el
 * usuario target vía auth.admin.generateLink() y registra la sesión en
 * impersonation_sessions (013) ANTES de devolver el link — si el insert de
 * auditoría fallara, preferimos no dar el link (falla cerrado, no abierto).
 *
 * El cliente (componente) es responsable de navegar al `actionLink` devuelto
 * — eso efectivamente loguea al admin COMO el usuario target en el browser.
 * Duración default: 1 hora (ver nota en la migración 013).
 */
export async function startImpersonationAction(
  targetUserId: string,
  targetBusinessId: string,
  reason?: string,
): Promise<ActionResult<{ actionLink: string }>> {
  const auth = await requireAgencyAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  // BUG REAL encontrado validando Sprint 6: sin este try/catch, cualquier
  // excepción acá adentro (ej. algo puntual de auth.admin.generateLink)
  // quedaba sin manejar dentro del startTransition del cliente — la pestaña
  // de soporte se quedaba en about:blank para siempre, sin error visible en
  // ningún lado. Con esto, cualquier falla vuelve como {ok:false, error}
  // igual que el resto de las acciones, y el cliente puede cerrar la
  // pestaña y mostrar el mensaje.
  try {
    const admin = createServiceClient()

    const { data: targetUser, error: targetUserError } = await admin
      .from("users")
      .select("email")
      .eq("id", targetUserId)
      .eq("business_id", targetBusinessId)
      .single()
    if (targetUserError || !targetUser) {
      return {
        ok: false,
        error: `No se encontró el usuario target en ese negocio${targetUserError ? ` (detalle: ${targetUserError.message})` : ""}.`,
      }
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h, ver nota de la migración 013

    const { error: auditError } = await admin.from("impersonation_sessions").insert({
      admin_id: auth.user.id,
      target_user_id: targetUserId,
      target_business_id: targetBusinessId,
      reason: reason ?? null,
      expires_at: expiresAt,
    })
    if (auditError) {
      return { ok: false, error: `No se pudo registrar la sesión de soporte: ${auditError.message}. Cancelado por seguridad.` }
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email,
    })
    if (linkError || !linkData) {
      return { ok: false, error: `No se pudo generar el acceso: ${linkError?.message ?? "sin detalle"}` }
    }

    // MISMO bug/fix que ya está documentado en Sprint 5 para el mail de
    // confirmación de cuenta: `linkData.properties.action_link` apunta al
    // endpoint hosteado de Supabase (`*.supabase.co/auth/v1/verify`), que
    // confirma el token del lado de Supabase pero no deja la cookie de
    // sesión bien puesta en NUESTRO dominio (la app usa @supabase/ssr,
    // que maneja cookies propias) — el resultado real, encontrado
    // validando esto en vivo, es que el link te termina mandando a
    // `/login` en vez de dejarte adentro. El fix es el mismo de siempre:
    // armar el link contra la Route Handler propia (`app/auth/confirm`)
    // usando `hashed_token` + `verification_type`, no `action_link`.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      return { ok: false, error: "Falta NEXT_PUBLIC_SITE_URL en las env vars — no se puede armar el link de soporte." }
    }
    const supportLink = `${siteUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=${linkData.properties.verification_type}&next=/dashboard`

    return { ok: true, data: { actionLink: supportLink } }
  } catch (err) {
    return {
      ok: false,
      error: `Error inesperado generando la impersonación: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export async function endImpersonationAction(sessionId: string): Promise<ActionResult> {
  const auth = await requireAgencyAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const admin = createServiceClient()
  const { error } = await admin
    .from("impersonation_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("admin_id", auth.user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

/**
 * Crea o edita un plan del catálogo (`plans` + `plan_modules`). No toca
 * negocios existentes con ese plan asignado — `subscriptions.plan_id`
 * sigue apuntando al mismo plan, solo cambia su definición. Si querés que
 * los negocios existentes reciban los módulos nuevos del plan editado, hay
 * que correr `changeBusinessPlanAction` para cada uno (o llamar
 * `apply_plan_modules` a mano) — este action NO lo hace automático, para no
 * tocar negocios sin que la agencia lo pida explícitamente.
 */
export async function savePlanAction(input: {
  id?: string // si viene, edita; si no, crea uno nuevo
  key: string
  name: string
  description: string
  price: number
  currency: string
  billingFrequency: "monthly" | "yearly"
  isActive: boolean
  moduleKeys: string[]
}): Promise<ActionResult<{ planId: string }>> {
  const auth = await requireAgencyAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const admin = createServiceClient()

  const { data: plan, error: planError } = await admin
    .from("plans")
    .upsert(
      {
        id: input.id,
        key: input.key,
        name: input.name,
        description: input.description,
        price: input.price,
        currency: input.currency,
        billing_frequency: input.billingFrequency,
        is_active: input.isActive,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single()

  if (planError || !plan) {
    return { ok: false, error: `No se pudo guardar el plan: ${planError?.message}` }
  }

  // Reemplaza el mapeo completo de módulos del plan (borra y vuelve a
  // insertar) en vez de hacer un diff — más simple y este catálogo cambia
  // con poca frecuencia, no vale la pena optimizar el diff acá.
  const { error: deleteError } = await admin.from("plan_modules").delete().eq("plan_id", plan.id)
  if (deleteError) {
    return { ok: false, error: `El plan se guardó pero no se pudieron actualizar sus módulos: ${deleteError.message}` }
  }

  if (input.moduleKeys.length > 0) {
    const { error: insertError } = await admin
      .from("plan_modules")
      .insert(input.moduleKeys.map((module_key) => ({ plan_id: plan.id, module_key })))
    if (insertError) {
      return { ok: false, error: `El plan se guardó pero no se pudieron cargar los módulos: ${insertError.message}` }
    }
  }

  revalidatePath("/planes")
  return { ok: true, data: { planId: plan.id } }
}
