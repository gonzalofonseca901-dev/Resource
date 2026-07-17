import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data"

// Mismo patrón que app/(backoffice)/layout.tsx: chequeo server-side acá,
// redirect si no corresponde. isAgencyAdmin viene de public.users vía
// getCurrentUser (ver lib/data/session.ts) — no es un permission del RBAC
// por negocio (003), es el flag aparte de agencia.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.isAgencyAdmin) redirect("/dashboard")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Recursos — Panel de agencia</span>
            <nav className="flex items-center gap-3 text-sm text-muted-foreground">
              <Link href="/negocios" className="hover:text-foreground">
                Negocios
              </Link>
              <Link href="/planes" className="hover:text-foreground">
                Planes
              </Link>
              <Link href="/auditoria" className="hover:text-foreground">
                Auditoría
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{user.fullName}</span>
            <Link href="/dashboard" className="hover:text-foreground">
              Volver al backoffice
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
