// Cliente de Supabase para Server Components, Server Actions y route handlers.
// Usa la anon key + las cookies de sesión del usuario logueado — las queries
// que hace este cliente respetan RLS como el usuario autenticado (no bypasea
// nada). NO usar este archivo en Client Components — para eso, client.ts.

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Se llama desde un Server Component (no puede escribir cookies).
            // Está bien ignorarlo si tenés el middleware de abajo refrescando
            // la sesión en cada request.
          }
        },
      },
    },
  )
}
