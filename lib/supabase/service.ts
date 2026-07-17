// Cliente de Supabase con la service_role key — bypasea RLS por completo.
//
// USO RESTRINGIDO: solo desde código que corre 100% server-side y que NO
// recibe input sin validar de un usuario común (route handlers de webhooks
// verificados, el cron de mora, y Server Actions que ya validaron
// is_agency_admin del caller "a mano" antes de llegar acá — mismo criterio
// de defensa en profundidad que supabase/functions/invite-user/index.ts).
//
// NUNCA importar este archivo desde un Client Component ni desde código que
// pueda correr en el browser — filtraría la service_role key al bundle.
//
// Requiere SUPABASE_SERVICE_ROLE_KEY en las env vars del server (Vercel /
// .env.local) — no confundir con NEXT_PUBLIC_SUPABASE_ANON_KEY, que es la
// que usa el resto de la app.

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Chequeo separado a propósito (en vez de `if (!url || !serviceKey)` como
  // antes): así el mensaje de error dice CUÁL de las dos falta, en vez de
  // obligar a adivinar entre dos variables distintas cada vez que salta.
  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL en las env vars de este ambiente — no se puede crear el cliente service_role.",
    )
  }
  if (!serviceKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en las env vars de este ambiente — no se puede crear el cliente service_role.",
    )
  }

  // Chequeo extra: decodifica el claim `role` del JWT antes de usarlo. Un
  // "permission denied for table X" en vez de un error de RLS normal es la
  // señal típica de que esta key es en realidad la `anon` (o cualquier JWT
  // que no sea service_role) pegada por error — mismo JWT format, fácil de
  // confundir copiando del dashboard. Esto lo detecta ACÁ, con un mensaje
  // claro, en vez de dejar que cada tabla tire su propio permission denied
  // genérico y haya que adivinar la causa de nuevo cada vez.
  const role = decodeJwtRole(serviceKey)
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY parece tener pegada la key equivocada — el JWT tiene role="${role}", se esperaba "service_role". Volvé a copiarla desde Supabase → Project Settings → API → "service_role" (NO la "anon"/"public").`,
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Decodifica (sin verificar firma, no hace falta para este chequeo) el claim `role` de un JWT de Supabase. */
function decodeJwtRole(jwt: string): string | null {
  try {
    const payloadSegment = jwt.split(".")[1]
    if (!payloadSegment) return null
    const json = Buffer.from(payloadSegment, "base64").toString("utf-8")
    const payload = JSON.parse(json)
    return typeof payload.role === "string" ? payload.role : null
  } catch {
    // Si no se puede decodificar (key con otro formato, típicamente las
    // nuevas "publishable"/"secret" keys de Supabase que no son JWT), no
    // bloqueamos acá — dejamos que el error real de permisos, si lo hay,
    // salga de la query en sí.
    return null
  }
}