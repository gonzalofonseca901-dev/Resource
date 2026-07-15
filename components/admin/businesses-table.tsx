"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { AdminBusinessListItem, SubscriptionStatus } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const STATUS_TONE: Record<SubscriptionStatus, "success" | "warning" | "danger" | "muted"> = {
  trialing: "muted",
  active: "success",
  past_due: "warning",
  suspended: "danger",
  canceled: "danger",
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Prueba",
  active: "Al día",
  past_due: "En mora",
  suspended: "Suspendido",
  canceled: "Cancelado",
}

export function BusinessesTable({ businesses }: { businesses: AdminBusinessListItem[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return businesses
    return businesses.filter(
      (b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
    )
  }, [businesses, query])

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar por nombre o slug..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Negocio</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Módulos activos</th>
              <th className="px-4 py-2 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <Link href={`/negocios/${b.id}`} className="font-medium hover:underline">
                    {b.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{b.slug}</div>
                </td>
                <td className="px-4 py-2">{b.planName ?? "Sin plan"}</td>
                <td className="px-4 py-2">
                  {b.subscriptionStatus ? (
                    <Badge tone={STATUS_TONE[b.subscriptionStatus]}>
                      {STATUS_LABEL[b.subscriptionStatus]}
                    </Badge>
                  ) : (
                    <Badge tone="muted">Sin suscripción</Badge>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {b.enabledModuleKeys.length} módulo{b.enabledModuleKeys.length === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No se encontraron negocios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
