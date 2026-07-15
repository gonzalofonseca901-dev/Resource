"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { AdminBusinessDetail, Plan } from "@/lib/types"
import { changeBusinessPlanAction, startImpersonationAction } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

interface BusinessDetailPanelProps {
  business: AdminBusinessDetail
  plans: Plan[]
}

export function BusinessDetailPanel({ business, plans }: BusinessDetailPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPlanId, setSelectedPlanId] = useState(business.subscription?.planId ?? plans[0]?.id ?? "")
  const [planError, setPlanError] = useState<string | null>(null)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)

  function handleChangePlan() {
    setPlanError(null)
    startTransition(async () => {
      const result = await changeBusinessPlanAction(business.id, selectedPlanId)
      if (!result.ok) {
        setPlanError(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleImpersonate(userId: string) {
    setImpersonateError(null)
    setImpersonatingUserId(userId)
    startTransition(async () => {
      const result = await startImpersonationAction(userId, business.id, "Soporte desde el panel de agencia.")
      setImpersonatingUserId(null)
      if (!result.ok) {
        setImpersonateError(result.error)
        return
      }
      // Pestaña nueva a propósito — no pisa la sesión de admin en esta
      // pestaña. Ver comentario en components/admin/impersonation-banner.tsx.
      window.open(result.data.actionLink, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">{business.name}</h1>
        <p className="text-sm text-muted-foreground">
          {business.slug} · {business.vertical} · alta{" "}
          {new Date(business.createdAt).toLocaleDateString("es-AR")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del negocio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>
              <span className="text-muted-foreground">Razón social:</span> {business.legalName || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">CUIT:</span> {business.taxId || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {business.email || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Teléfono:</span> {business.phone || "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suscripción</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {business.subscription ? (
              <div className="flex flex-col gap-1">
                <div>
                  <span className="text-muted-foreground">Estado:</span> {business.subscription.status}
                </div>
                <div>
                  <span className="text-muted-foreground">Plan actual:</span> {business.subscription.planName}
                </div>
                {business.subscription.currentPeriodEnd && (
                  <div>
                    <span className="text-muted-foreground">Vence:</span>{" "}
                    {new Date(business.subscription.currentPeriodEnd).toLocaleDateString("es-AR")}
                  </div>
                )}
                {business.subscription.manualOverride && (
                  <Badge tone="warning">Override manual activo</Badge>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Sin suscripción cargada todavía.</p>
            )}

            <div className="flex items-end gap-2 border-t border-border pt-3">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-muted-foreground">Cambiar plan (override manual)</label>
                <Select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.currency} {p.price}
                    </option>
                  ))}
                </Select>
              </div>
              <Button size="sm" onClick={handleChangePlan} disabled={isPending || !selectedPlanId}>
                Aplicar
              </Button>
            </div>
            {planError && <p className="text-xs text-destructive">{planError}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {business.enabledModuleKeys.length === 0 && (
              <span className="text-sm text-muted-foreground">Sin módulos activos.</span>
            )}
            {business.enabledModuleKeys.map((key) => (
              <Badge key={key} tone="muted">
                {key}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {impersonateError && <p className="text-xs text-destructive">{impersonateError}</p>}
          {business.users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {u.fullName} {u.isOwner && <Badge tone="muted">Owner</Badge>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {u.email} · {u.roleName}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending && impersonatingUserId === u.id}
                onClick={() => handleImpersonate(u.id)}
              >
                {isPending && impersonatingUserId === u.id ? "Generando..." : "Entrar a dar soporte"}
              </Button>
            </div>
          ))}
          {business.users.length === 0 && (
            <p className="text-sm text-muted-foreground">Este negocio no tiene usuarios cargados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
