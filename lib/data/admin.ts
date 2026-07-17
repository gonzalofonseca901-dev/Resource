// Fetchers del panel de agencia (app/(admin)). Corren con el cliente normal
// (anon key + cookies del admin) — el acceso cross-tenant lo da la policy de
// RLS agency_admin_select_* (migración 011), no una key especial. Si estas
// queries no devuelven nada para un usuario que debería ser admin, lo más
// probable es que is_agency_admin() esté en false para ese usuario, no un
// problema de este archivo.

import type { AdminBusinessDetail, AdminBusinessListItem, AdminBusinessUser, ImpersonationSession, Plan } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function getBusinessesForAdmin(): Promise<AdminBusinessListItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `id, name, slug, vertical, created_at,
       subscriptions(status, plans(name)),
       business_modules(module_key, enabled)`,
    )
    .order("created_at", { ascending: false })

  if (error) throw new Error(`No se pudo cargar el listado de negocios: ${error.message}`)

  return (data ?? []).map((b) => {
    const sub = Array.isArray(b.subscriptions) ? b.subscriptions[0] : b.subscriptions
    const plan = sub ? (Array.isArray(sub.plans) ? sub.plans[0] : sub.plans) : null
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      vertical: b.vertical,
      createdAt: b.created_at,
      planName: plan?.name ?? null,
      subscriptionStatus: sub?.status ?? null,
      enabledModuleKeys: (b.business_modules ?? [])
        .filter((m: { enabled: boolean }) => m.enabled)
        .map((m: { module_key: string }) => m.module_key),
    }
  })
}

export async function getBusinessAdminDetail(businessId: string): Promise<AdminBusinessDetail | null> {
  const supabase = await createClient()

  const [{ data: business, error: businessError }, { data: users }, { data: modules }] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        `id, name, slug, legal_name, tax_id, email, phone, vertical, created_at,
         subscriptions(id, business_id, plan_id, status, mp_preapproval_id,
           current_period_start, current_period_end, grace_until, canceled_at,
           manual_override, manual_override_note, plans(key, name))`,
      )
      .eq("id", businessId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id, full_name, email, role_legacy, roles(name)")
      .eq("business_id", businessId),
    supabase.from("business_modules").select("module_key, enabled").eq("business_id", businessId),
  ])

  if (businessError || !business) return null

  const sub = Array.isArray(business.subscriptions) ? business.subscriptions[0] : business.subscriptions
  const plan = sub ? (Array.isArray(sub.plans) ? sub.plans[0] : sub.plans) : null

  const adminUsers: AdminBusinessUser[] = (users ?? []).map((u) => {
    const role = Array.isArray(u.roles) ? u.roles[0] : u.roles
    return {
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      roleName: role?.name ?? u.role_legacy,
      isOwner: u.role_legacy === "owner",
    }
  })

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    legalName: business.legal_name ?? "",
    taxId: business.tax_id ?? "",
    email: business.email ?? "",
    phone: business.phone ?? "",
    vertical: business.vertical,
    createdAt: business.created_at,
    subscription: sub
      ? {
          id: sub.id,
          businessId: sub.business_id,
          planId: sub.plan_id,
          planKey: plan?.key ?? "",
          planName: plan?.name ?? "",
          status: sub.status,
          mpPreapprovalId: sub.mp_preapproval_id,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          graceUntil: sub.grace_until,
          canceledAt: sub.canceled_at,
          manualOverride: sub.manual_override,
          manualOverrideNote: sub.manual_override_note,
        }
      : null,
    enabledModuleKeys: (modules ?? [])
      .filter((m) => m.enabled)
      .map((m) => m.module_key),
    users: adminUsers,
  }
}

/**
 * Chequea si el usuario logueado ACTUALMENTE está siendo impersonado (para
 * el banner en el backoffice). Usa service_role a propósito: la policy de
 * impersonation_sessions (013) solo deja leer a agency admins — el usuario
 * impersonado (que no es admin) no puede leer su propia fila por RLS normal,
 * y es justo lo que necesitamos mostrarle acá. El scope de la query
 * (`target_user_id = userId`, con `userId` resuelto server-side desde la
 * sesión real vía getCurrentUser en el caller) es lo que mantiene esto
 * seguro pese al service_role — nunca se expone un `userId` arbitrario
 * pasado por el cliente.
 */
export async function getActiveImpersonationForUser(userId: string): Promise<ImpersonationSession | null> {
  const admin = createServiceClient()

  const { data, error } = await admin
    .from("impersonation_sessions")
    .select("id, admin_id, target_user_id, target_business_id, started_at, expires_at, ended_at, businesses(name)")
    .eq("target_user_id", userId)
    .is("ended_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const business = Array.isArray(data.businesses) ? data.businesses[0] : data.businesses

  return {
    id: data.id,
    adminId: data.admin_id,
    targetUserId: data.target_user_id,
    targetBusinessId: data.target_business_id,
    targetBusinessName: business?.name ?? "",
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    endedAt: data.ended_at,
  }
}

/** Todos los planes (incluidos inactivos) para la pantalla de gestión de planes del panel de agencia. */
export async function getAllPlansForAdmin(): Promise<Plan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("plans")
    .select("id, key, name, description, price, currency, billing_frequency, is_active, plan_modules(module_key)")
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
