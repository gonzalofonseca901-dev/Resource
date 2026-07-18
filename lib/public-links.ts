// Links internos de la landing pública (Sprint 7) — hay dos formas válidas
// de llegar a estas páginas, y un link hardcodeado como href="/reservar"
// solo funciona en UNA de las dos:
//
// 1. **Por subdominio real** (`negocio.turecursos.com`) — proxy.ts reescribe
//    la request server-side, invisible para el browser. La URL que el
//    visitante VE en la barra sigue siendo `/`, `/reservar`, etc. (sin el
//    prefijo `/sitio/negocio`) — ahí un Link con href="/reservar" es
//    correcto.
// 2. **Por el path directo** (`tudominio.vercel.app/sitio/negocio`) — el
//    atajo que se usa para probar esto sin tener que configurar DNS
//    wildcard todavía. Acá la URL visible SÍ tiene el prefijo, y un Link
//    con href="/reservar" (bug real encontrado probando esto en vivo)
//    navega a un `/reservar` de nivel raíz que no existe — 404 o "no hace
//    nada" según el caso.
//
// Esta función decide cuál de los dos casos aplica mirando el mismo host
// que ya resuelve proxy.ts (reusando resolveTenantSlug, no una lógica
// paralela) y arma el href que corresponda.

import { headers } from "next/headers"
import { resolveTenantSlug } from "@/lib/tenant-host"

/** `path` sin slash inicial, ej. "reservar" — no "/reservar". */
export async function publicHref(slug: string, path: string = ""): Promise<string> {
  const host = (await headers()).get("host") ?? ""
  const isRealSubdomain = resolveTenantSlug(host) !== null
  const suffix = path ? `/${path}` : ""

  return isRealSubdomain ? suffix || "/" : `/sitio/${slug}${suffix}`
}
