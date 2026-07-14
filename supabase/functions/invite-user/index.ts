// supabase/functions/invite-user/index.ts
//
// Cierra el gap identificado en el context pack: invitar staff desde el
// backoffice requiere la service_role key, que el backoffice (anon key) no
// tiene. Esta función SÍ la tiene — corre server-side en la infraestructura
// de Supabase, nunca en el browser.
//
// DEFENSA EN PROFUNDIDAD (mismo criterio que el resto del proyecto, ver
// context pack y lib/actions/*.ts): el Server Action que llama a esto YA
// valida core.manage_users antes de invocar la función. Acá se vuelve a
// validar del lado de la función — no confiar en que el único caller
// legítimo sea siempre el Server Action (alguien podría invocar la función
// directo con un JWT robado de sesión, por ejemplo). Dos capas, no una.
//
// DEPLOY (manual, cuando tengas tiempo):
//   supabase functions deploy invite-user
// No hace falta setear SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY a mano — Supabase
// se los inyecta automáticamente a toda Edge Function del proyecto.

import { createClient } from "jsr:@supabase/supabase-js@2"

interface InviteUserPayload {
  email: string
  fullName: string
  roleId: string
  locationIds?: string[]
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return jsonResponse({ error: "Falta el header Authorization." }, 401)
  }

  let payload: InviteUserPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: "Body inválido." }, 400)
  }

  if (!payload.email || !payload.fullName || !payload.roleId) {
    return jsonResponse({ error: "Faltan campos: email, fullName y roleId son requeridos." }, 400)
  }

  // 1. Cliente "como el usuario que llama" (anon key + su JWT) — para
  // resolver quién es y validar el permiso, respetando RLS igual que
  // cualquier query del backoffice.
  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user: callerAuthUser }, error: callerAuthError } = await callerClient.auth.getUser()
  if (callerAuthError || !callerAuthUser) {
    return jsonResponse({ error: "Sesión inválida." }, 401)
  }

  const { data: hasPermission, error: permError } = await callerClient
    .rpc("auth_has_permission", { p_permission_key: "core.manage_users" })

  if (permError || !hasPermission) {
    return jsonResponse({ error: "No tenés permiso para invitar usuarios." }, 403)
  }

  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from("users")
    .select("business_id")
    .eq("id", callerAuthUser.id)
    .single()

  if (callerProfileError || !callerProfile) {
    return jsonResponse({ error: "No se pudo resolver el negocio del usuario que invita." }, 500)
  }

  const businessId = callerProfile.business_id

  // 2. Cliente con service_role — recién acá, para las escrituras que RLS no
  // permitiría a un usuario normal (crear auth.users, insertar en public.users
  // con un id que no es auth.uid() del caller).
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // El rol tiene que existir y pertenecer al MISMO negocio del caller — sin
  // este chequeo, un owner del negocio A podría (con el roleId correcto)
  // asignarle a alguien un rol del negocio B.
  const { data: role, error: roleError } = await adminClient
    .from("roles")
    .select("id, business_id")
    .eq("id", payload.roleId)
    .eq("business_id", businessId)
    .single()

  if (roleError || !role) {
    return jsonResponse({ error: "El rol indicado no existe en tu negocio." }, 400)
  }

  // inviteUserByEmail crea el auth.users (email confirmado automáticamente,
  // no pasa por el flujo de "Confirm email" del signup normal — tiene
  // sentido: a un invitado no hace falta pedirle que confirme algo que ya
  // confirmó quien lo invitó) y le manda un mail con un magic link para que
  // setee su contraseña.
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    payload.email,
    { data: { full_name: payload.fullName } },
  )

  if (inviteError || !inviteData.user) {
    return jsonResponse({ error: `No se pudo invitar: ${inviteError?.message}` }, 500)
  }

  // role_legacy sigue NOT NULL en el schema (ver nota en
  // 010_provision_business.sql) — 'staff' es el único valor razonable para
  // un invitado que no es owner. Si en el futuro se permiten roles custom
  // más allá de owner/staff, esta columna legacy va a necesitar revisarse
  // (el CHECK constraint de la tabla solo acepta 'super_admin'/'owner'/'staff').
  const { error: insertError } = await adminClient.from("users").insert({
    id: inviteData.user.id,
    business_id: businessId,
    email: payload.email,
    full_name: payload.fullName,
    role_id: role.id,
    role_legacy: "staff",
    is_agency_admin: false,
  })

  if (insertError) {
    // El auth.users ya se creó — si el insert en public.users falla, lo
    // borramos para no dejar un usuario auth "huérfano" sin perfil (no habría
    // forma de reintentar la invitación con el mismo mail, choca con el
    // usuario auth ya existente).
    await adminClient.auth.admin.deleteUser(inviteData.user.id)
    return jsonResponse({ error: `No se pudo crear el perfil: ${insertError.message}` }, 500)
  }

  if (payload.locationIds && payload.locationIds.length > 0) {
    const rows = payload.locationIds.map((locationId) => ({
      user_id: inviteData.user!.id,
      location_id: locationId,
    }))
    // No fatal si esto falla — el usuario ya quedó creado con acceso a TODAS
    // las sedes por default (user_location_access vacío = todas, ver
    // lib/permissions.ts). El scoping se puede ajustar después a mano desde
    // Configuración si este insert puntual falla.
    await adminClient.from("user_location_access").insert(rows)
  }

  return jsonResponse({ ok: true, userId: inviteData.user.id })
})

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
