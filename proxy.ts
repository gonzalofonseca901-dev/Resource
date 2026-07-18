import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { resolveTenantSlug } from "@/lib/tenant-host"

// Sprint 7 — resuelve `business` por subdominio → slug.
// `negocio.turecursos.com` (o `negocio.localhost:3000` en dev) se reescribe
// internamente a `/sitio/negocio/...`, sin que el visitante vea el cambio en
// la URL. El dominio raíz de la plataforma (`turecursos.com`, o el dominio
// de Vercel sin subdominio de negocio) sigue yendo al backoffice/marketing
// normal — NO se reescribe nada ahí.
//
// Dominio propio (CNAME) por negocio queda FUERA de acá a propósito (ver
// context pack, Sprint 7: "no bloqueante para este sprint") — cuando se
// implemente, va a necesitar resolver el hostname completo contra una
// columna `custom_domain` en `businesses` en vez de derivar el slug del
// subdominio, un caso aparte de este.
//
// NOTA: este archivo se llama `proxy.ts` y exporta `proxy`, no
// `middleware.ts`/`middleware` — Next.js 16 deprecó esa convención vieja
// (ver warning de build: "The middleware file convention is deprecated.
// Please use proxy instead"). La lógica es idéntica, es solo el rename que
// pide la versión nueva.
export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? ""
  const slug = resolveTenantSlug(hostname)

  if (slug && !request.nextUrl.pathname.startsWith("/sitio/")) {
    const url = request.nextUrl.clone()
    url.pathname = `/sitio/${slug}${request.nextUrl.pathname}`
    return NextResponse.rewrite(url)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    // Corre en todo menos assets estáticos y de imagen.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
