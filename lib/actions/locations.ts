"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/session"
import { can, PERMISSIONS } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { ok: true } | { ok: false; error: string }

interface LocationInput {
  id?: string
  name: string
  address: string
  city: string
  phone: string
  whatsappNumber: string
  isActive: boolean
}

export async function saveLocationAction(draft: LocationInput): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: "No hay sesión activa." }
  if (!can(user, PERMISSIONS.LOCATION_MANAGE)) {
    return { ok: false, error: "No tenés permiso para gestionar sedes." }
  }

  const supabase = await createClient()
  const payload = {
    name: draft.name,
    address: draft.address || null,
    city: draft.city || null,
    phone: draft.phone || null,
    whatsapp_number: draft.whatsappNumber || null,
    is_active: draft.isActive,
  }

  const { error } = draft.id
    ? await supabase.from("locations").update(payload).eq("id", draft.id)
    : await supabase
        .from("locations")
        .insert({ ...payload, business_id: user.businessId })

  if (error) return { ok: false, error: `No se pudo guardar la sede: ${error.message}` }

  revalidatePath("/configuracion")
  revalidatePath("/dashboard")
  revalidatePath("/agenda")
  return { ok: true }
}
