"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { AdminBusinessDetail, ModuleDefinition, Plan } from "@/lib/types"
import { changeBusinessPlanAction, startImpersonationAction, toggleBusinessModuleAction } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface BusinessDetailPanelProps {
  business: AdminBusinessDetail
  plans: Plan[]
  moduleCatalog: ModuleDefinition[]
}

export function BusinessDetailPanel({ business, plans, moduleCatalog }: BusinessDetailPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPlanId, setSelectedPlanId] = useState(business.subscription?.planId ?? plans[0]?.id ?? "")
  const [planError, setPlanError] = useState<string | null>(null)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set(business.enabledModuleKeys))
  const [moduleError, setModuleError] = useState<string | null>(null)
  const [togglingModuleKey, setTogglingModuleKey] = useState<string | null>(null)

  function handleToggleModule(moduleKey: string, nextEnabled: boolean) {
    setModuleError(null)
    setTogglingModuleKey(moduleKey)
    // Optimista: el catálogo de módulos cambia poco, y si falla lo revertimos abajo.
    setEnabledModules((prev) => {
      const next = new Set(prev)
      if (nextEnabled) next.add(moduleKey)
      else next.delete(moduleKey)
      return next
    })
    startTransition(async () => {
      const result = await toggleBusinessModuleAction(business.id, moduleKey, nextEnabled)
      setTogglingModuleKey(null)
      if (!result.ok) {
        setModuleError(result.error)
        // revertir el optimista
        setEnabledModules((prev) => {
          const next = new Set(prev)
          if (nextEnabled) next.delete(moduleKey)
          else next.add(moduleKey)
          return next
        })
      }
    })
  }

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

    // Abrir la pestaña ACÁ, síncrono, como resultado directo del click —
    // no después del await del Server Action. Si se abre recién cuando
    // llega la respuesta, el navegador ya no lo considera un popup
    // "pedido por el usuario" y lo bloquea en silencio (sin tirar error,
    // por eso no se notaba nada raro: la pestaña simplemente no aparecía y
    // quedabas viendo tu propia sesión). Se abre en blanco y se redirige
    // recién cuando tenemos el link real.
    const supportTab = window.open("", "_blank", "noopener,noreferrer")
    if (!supportTab) {
      setImpersonatingUserId(null)
      setImpersonateError(
        "El navegador bloqueó la pestaña nueva. Permití pop-ups para este sitio (ícono en la barra de direcciones) e intentá de nuevo.",
      )
      return
    }
    supportTab.document.write("Generando acceso de soporte...")

    startTransition(async () => {
      const result = await startImpersonationAction(userId, business.id, "Soporte desde el panel de agencia.")
      setImpersonatingUserId(null)
      if (!result.ok) {
        setImpersonateError(result.error)
        supportTab.close()
        return
      }
      supportTab.location.href = result.data.actionLink
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
          <CardTitle>Módulos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {moduleError && <p className="text-xs text-destructive">{moduleError}</p>}
          {moduleCatalog.map((mod) => {
            const isEnabled = enabledModules.has(mod.key)
            return (
              <div
                key={mod.key}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {mod.name} {mod.required && <Badge tone="muted">Core</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">{mod.description}</span>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(next) => handleToggleModule(mod.key, next)}
                  disabled={mod.required || (isPending && togglingModuleKey === mod.key)}
                  aria-label={`Activar ${mod.name}`}
                />
              </div>
            )
          })}
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
