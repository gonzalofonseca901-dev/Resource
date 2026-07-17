"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { endImpersonationAction } from "@/lib/actions/admin"

interface ImpersonationBannerProps {
  sessionId: string
  targetBusinessName: string
}

// Nota de diseño (ver components/admin/business-detail-panel.tsx): el link
// de soporte se pensó para abrirse en una ventana de INCÓGNITO, no en una
// pestaña nueva del mismo navegador — las pestañas comparten cookies, así
// que solo incógnito aísla de verdad la sesión de soporte de la sesión de
// admin. "Volver a mi cuenta" acá no puede "restaurar" la sesión de admin
// en ESTA ventana (es una sesión de auth distinta, ya logueada como el
// usuario target) — lo que hace es cerrar la sesión de soporte y mandar a
// /login. La ventana de admin original (fuera de incógnito) queda intacta
// porque nunca compartió cookies con esta.
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
