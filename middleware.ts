import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Sprint 7 — Next.js middleware resuelve `business` por subdominio → slug.
// `negocio.turecursos.com` (o `negocio.localhost:3000` en dev) se reescribe
// internamente a `/sitio/negocio/...`, sin que el visitante vea el cambio en
// la URL. El dominio raíz de la plataforma (`turecursos.com`, o el dominio
// de Vercel sin subdominio de negocio) sigue yendo al backoffice/marketing
// normal — NO se reescribe nada ahí.
//
// Dominio propio (CNAME) por negocio queda FUERA de este middleware a
// propósito (ver context pack, Sprint 7: "no bloqueante para este sprint")
// — cuando se implemente, va a necesitar resolver el hostname completo
// contra una columna `custom_domain` en `businesses` en vez de derivar el
// slug del subdominio, un caso aparte de este.
function resolveTenantSlug(hostname: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN // ej. "turecursos.com", sin protocolo ni puerto
  const host = hostname.split(":")[0] // saca el puerto (localhost:3000 en dev)

  // Dev local: "padel-test.localhost" → slug "padel-test". Sin esto no hay
  // forma práctica de probar el subdominio en desarrollo.
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length)
    return sub && sub !== "www" ? sub : null
  }

  if (!rootDomain) return null // sin NEXT_PUBLIC_ROOT_DOMAIN configurada, no hay forma segura de derivar el subdominio
  if (host === rootDomain || host === `www.${rootDomain}`) return null
  if (!host.endsWith(`.${rootDomain}`)) return null // dominio no reconocido (ej. *.vercel.app de preview) — no reescribir

  const sub = host.slice(0, -(`.${rootDomain}`.length))
  return sub && sub !== "www" ? sub : null
}

export async function middleware(request: NextRequest) {
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
