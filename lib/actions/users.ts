"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { ok: true } | { ok: false; error: string }

export async function assignRoleAction(userId: string, roleId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.USER_MANAGE)) {
    return { ok: false, error: "No tenés permiso para gestionar usuarios." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("users").update({ role_id: roleId }).eq("id", userId)

  if (error) return { ok: false, error: `No se pudo asignar el rol: ${error.message}` }

  revalidatePath("/configuracion")
  return { ok: true }
}

export async function inviteUserAction(input: {
  email: string
  fullName: string
  roleId: string
  locationIds?: string[]
}): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.USER_MANAGE)) {
    return { ok: false, error: "No tenés permiso para invitar usuarios." }
  }

  const supabase = await createClient()

  // supabase.functions.invoke, llamado desde un cliente server-side ya
  // autenticado, manda el JWT de la sesión actual en el header Authorization
  // automáticamente — la Edge Function lo usa para revalidar el permiso del
  // lado suyo (defensa en profundidad, ver comentario en supabase/functions/invite-user/index.ts).
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: input,
  })

  if (error) {
    return { ok: false, error: `No se pudo invitar al usuario: ${error.message}` }
  }

  if (data?.error) {
    return { ok: false, error: data.error }
  }

  revalidatePath("/configuracion")
  return { ok: true }
}
