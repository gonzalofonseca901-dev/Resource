// app/auth/confirm/route.ts
//
// Adonde llega el usuario al clickear el link de confirmación del mail (ver
// nota de configuración del template en lib/actions/signup.ts). Acá, y recién
// acá, existe una sesión válida — es el único lugar correcto para llamar a
// provision_business().
//
// token_hash + type es el patrón recomendado por Supabase para verificar
// desde una Route Handler propia (en vez de dejar que el link pegue directo
// contra el dominio de Supabase) — así el control de qué pasa después de
// confirmar queda en nuestro código, no en un redirect genérico de Supabase.

import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/onboarding"

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/signup?error=${encodeURIComponent("Link de confirmación inválido o vencido.")}`,
    )
  }

  const supabase = await createClient()

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  if (verifyError || !verifyData.session || !verifyData.user) {
    return NextResponse.redirect(
      `${origin}/signup?error=${encodeURIComponent(verifyError?.message ?? "No se pudo confirmar el mail.")}`,
    )
  }

  // Datos del negocio guardados en el signUp() original (lib/actions/signup.ts).
  const meta = verifyData.user.user_metadata as {
    full_name?: string
    business_name?: string
    slug?: string
    vertical?: string
    legal_name?: string | null
    tax_id?: string | null
    phone?: string | null
  }

  const { error: provisionError } = await supabase
    .rpc("provision_business", {
      p_slug: meta.slug,
      p_name: meta.business_name,
      p_vertical: meta.vertical,
      p_legal_name: meta.legal_name ?? null,
      p_tax_id: meta.tax_id ?? null,
      p_email: verifyData.user.email,
      p_phone: meta.phone ?? null,
      p_full_name: meta.full_name,
    })
    .single()

  if (provisionError) {
    // Log liviano para observabilidad en producción — sin el dump de meta/
    // error completo que usamos mientras diagnosticábamos el bug de la
    // plantilla de mail. Suficiente para detectar si vuelve a pasar.
    console.error("[confirm] provision_business falló para user", verifyData.user.id, "-", provisionError.message)
    // "ya tiene un negocio asociado" = el usuario reclickeó un link viejo
    // después de haber confirmado antes (provisioning idempotente, ver
    // 010_provision_business.sql) — no es un error real, lo mandamos adentro.
    if (provisionError.message.includes("ya tiene un negocio asociado")) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
    return NextResponse.redirect(
      `${origin}/signup?error=${encodeURIComponent(`No se pudo crear el negocio: ${provisionError.message}`)}`,
    )
  }

  return NextResponse.redirect(`${origin}${next}`)
}