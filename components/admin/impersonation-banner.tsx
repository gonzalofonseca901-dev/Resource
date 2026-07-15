"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { endImpersonationAction } from "@/lib/actions/admin"

interface ImpersonationBannerProps {
  sessionId: string
  targetBusinessName: string
}

// Nota de diseño (ver lib/actions/admin.ts): la impersonación se abre en una
// pestaña nueva a propósito, así el admin no pierde su propia sesión en la
// pestaña original. "Volver a mi cuenta" acá no puede "restaurar" la sesión
// de admin en ESTA pestaña (es una sesión de auth distinta, ya logueada como
// el usuario target) — lo que hace es cerrar la sesión de soporte y mandar a
// /login, dejando la pestaña original del admin intacta como estaba.
export function ImpersonationBanner({ sessionId, targetBusinessName }: ImpersonationBannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleEnd() {
    startTransition(async () => {
      await endImpersonationAction(sessionId)
      router.push("/login")
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-status-pending px-4 py-2 text-sm font-medium text-white">
      <span>
        Estás viendo <strong>{targetBusinessName}</strong> en modo soporte (sesión de impersonación).
      </span>
      <button
        onClick={handleEnd}
        disabled={isPending}
        className="rounded-md border border-white/40 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
      >
        {isPending ? "Cerrando..." : "Volver a mi cuenta"}
      </button>
    </div>
  )
}
