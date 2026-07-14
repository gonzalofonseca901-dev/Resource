"use server"

// Server Action para /signup — versión para "Confirm email" ON.
//
// Acá NO se llama a provision_business(): con confirmación de email activa,
// signUp() no devuelve sesión (auth.uid() sería null del lado de Postgres,
// la función lo rechazaría). Los datos del negocio viajan como user_metadata
// del propio auth.users hasta que el usuario confirma — se leen recién en
// app/auth/confirm/route.ts, que es donde por fin existe una sesión y se
// llama al RPC.
//
// Requiere en el Supabase Dashboard (manual, no es código):
//   1. Authentication > URL Configuration > agregar como Redirect URL
//      permitida: {tu dominio}/auth/confirm (dev y prod).
//   2. Authentication > Email Templates > "Confirm signup": el link tiene
//      que apuntar a
//        {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/onboarding
//      en vez del link default de Supabase (que verifica en su propio
//      dominio y no le da control a nuestra ruta de hacer el provisioning).

import { createClient } from "@/lib/supabase/server"

type SignupInput = {
  email: string
  password: string
  fullName: string
  businessName: string
  slug: string
  vertical: string
  legalName: string
  taxId: string
  phone: string
}

type SignupResult =
  | { ok: true; needsEmailConfirmation: true }
  | { ok: false; error: string }

export async function signupAction(input: SignupInput): Promise<SignupResult> {
  const supabase = await createClient()

  const { error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // emailRedirectTo es un fallback/soporte — el link real lo arma la
      // plantilla de mail en el dashboard (ver comentario arriba). Dejarlo
      // acá igual por si el template usa {{ .RedirectTo }}.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      // Todo lo que provision_business() necesita, guardado en el propio
      // auth.users hasta que se confirme el mail. Nombres de key en
      // snake_case a propósito: así se leen directo en el callback sin
      // mapear camelCase → snake_case dos veces.
      data: {
        full_name: input.fullName,
        business_name: input.businessName,
        slug: input.slug,
        vertical: input.vertical,
        legal_name: input.legalName || null,
        tax_id: input.taxId || null,
        phone: input.phone || null,
      },
    },
  })

  if (signUpError) {
    return { ok: false, error: `No se pudo crear la cuenta: ${signUpError.message}` }
  }

  return { ok: true, needsEmailConfirmation: true }
}
