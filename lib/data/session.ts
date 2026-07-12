// Session access — implementación real contra Supabase Auth + tabla `users`.
// Mismo signature que la versión mock (getCurrentUser) pero ahora puede
// devolver null (usuario no logueado): los call sites tienen que manejar eso
// redirigiendo a /login. RESOURCE_VIEW es sintético (no vive en la tabla
// `permissions` de la DB) — se agrega siempre acá, ver lib/permissions.ts.

import type { User } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    if (authError) console.error("[getCurrentUser] auth.getUser() error:", authError.message)
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, business_id, full_name, email, role_id, roles(id, key, name)")
    .eq("id", authUser.id)
    .single()

  if (profileError || !profile) {
    console.error(
      "[getCurrentUser] users profile lookup failed for auth id",
      authUser.id,
      "-",
      profileError?.message ?? "sin datos",
      profileError?.details ?? "",
    )
    return null
  }

  // roles(...) viene embebido por la FK users.role_id -> roles.id. Supabase
  // lo tipa como array aunque acá siempre es 0 o 1 fila (relación many-to-one).
  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles
  if (!role) {
    console.error("[getCurrentUser] usuario sin rol embebido, role_id:", profile.role_id)
    return null
  }

  const [{ data: permissionRows }, { count: scopedLocationCount }, { data: locationRows }] =
    await Promise.all([
      supabase.rpc("auth_my_permissions"),
      supabase
        .from("user_location_access")
        .select("location_id", { count: "exact", head: true })
        .eq("user_id", profile.id),
      supabase.from("user_location_access").select("location_id").eq("user_id", profile.id),
    ])

  // Convención del frontend: locationIds:[] = acceso a todas las sedes.
  // Sin filas en user_location_access = sin scoping explícito = todas (ver 003 sección 8).
  const locationIds =
    scopedLocationCount && scopedLocationCount > 0
      ? (locationRows ?? []).map((r: { location_id: string }) => r.location_id)
      : []

  return {
    id: profile.id,
    businessId: profile.business_id,
    fullName: profile.full_name,
    email: profile.email,
    locationIds,
    role: {
      id: role.id,
      businessId: profile.business_id,
      key: role.key,
      name: role.name,
      permissions: [
        ...(permissionRows ?? []).map((r: { key: string }) => r.key),
        "resources.view", // sintético — ver nota en lib/permissions.ts
      ],
    },
  }
}
