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

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
