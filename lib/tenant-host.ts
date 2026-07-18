// Resolución de negocio por subdominio — compartida entre proxy.ts (donde
// se usa para reescribir la request) y los Server Components de la landing
// pública (donde se usa para saber si el visitante llegó por subdominio real
// o por el path directo /sitio/[slug], y así armar los links internos bien
// — ver lib/public-links.ts).

export function resolveTenantSlug(hostname: string): string | null {
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
