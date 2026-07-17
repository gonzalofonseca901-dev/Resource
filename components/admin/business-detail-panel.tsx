"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { AdminBusinessDetail, ModuleDefinition, Plan, Role } from "@/lib/types"
import {
  changeBusinessPlanAction,
  inviteUserToBusinessAction,
  startImpersonationAction,
  toggleBusinessModuleAction,
} from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface BusinessDetailPanelProps {
  business: AdminBusinessDetail
  plans: Plan[]
  moduleCatalog: ModuleDefinition[]
  roles: Role[]
}

export function BusinessDetailPanel({ business, plans, moduleCatalog, roles }: BusinessDetailPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPlanId, setSelectedPlanId] = useState(business.subscription?.planId ?? plans[0]?.id ?? "")
  const [planError, setPlanError] = useState<string | null>(null)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)
  const [impersonationLink, setImpersonationLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFullName, setInviteFullName] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState(roles[0]?.id ?? "")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [isInviting, startInviteTransition] = useTransition()
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
    setImpersonationLink(null)

    // Ya no se intenta abrir la pestaña con window.open(): además de que
    // los navegadores lo bloquean si no es resultado 100% síncrono del
    // click (mala UX pedirle a un usuario no técnico que vaya a habilitar
    // pop-ups a mano), hay un problema más de fondo — las pestañas del
    // mismo navegador COMPARTEN cookies. Aunque el popup se abra bien, esa
    // sesión de soporte termina pisando la cookie de la pestaña de admin
    // también, no son sesiones aisladas por el solo hecho de estar en
    // pestañas distintas. La solución real es una ventana de incógnito
    // (cookie jar separado de verdad) — por eso acá mostramos el link para
    // copiar, con esa instrucción, en vez de intentar automatizarlo.
    startTransition(async () => {
      const result = await startImpersonationAction(userId, business.id, "Soporte desde el panel de agencia.")
      setImpersonatingUserId(null)
      if (!result.ok) {
        setImpersonateError(result.error)
        return
      }
      setImpersonationLink(result.data.actionLink)
    })
  }

  function handleCopyLink() {
    if (!impersonationLink) return
    navigator.clipboard.writeText(impersonationLink).then(
      () => setLinkCopied(true),
      () => setImpersonateError("No se pudo copiar el link automáticamente — seleccionalo y copialo a mano."),
    )
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(false)

    if (!inviteEmail || !inviteFullName || !inviteRoleId) {
      setInviteError("Completá email, nombre y rol.")
      return
    }

    startInviteTransition(async () => {
      const result = await inviteUserToBusinessAction({
        businessId: business.id,
        email: inviteEmail,
        fullName: inviteFullName,
        roleId: inviteRoleId,
      })
      if (!result.ok) {
        setInviteError(result.error)
        return
      }
      setInviteSuccess(true)
      setInviteEmail("")
      setInviteFullName("")
      router.refresh()
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
          {impersonationLink && (
            <div className="flex flex-col gap-2 rounded-md border border-status-pending/40 bg-status-pending/10 p-3 text-sm">
              <p>
                Listo. Para no pisar tu propia sesión de admin, abrí este link en una{" "}
                <strong>ventana de incógnito</strong> (Ctrl/Cmd+Shift+N) — ahí sí queda
                completamente separado de esta pestaña.
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={impersonationLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setLinkCopied(false)
                    handleCopyLink()
                  }}
                >
                  {linkCopied ? "Copiado ✓" : "Copiar link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El link expira en 1 hora o al usarlo una vez, lo que pase primero.
              </p>
            </div>
          )}
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

          <form onSubmit={handleInvite} className="flex flex-col gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">Invitar usuario a este negocio</span>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Nombre completo"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select value={inviteRoleId} onChange={(e) => setInviteRoleId(e.target.value)}>
                {roles.length === 0 && <option value="">Sin roles cargados</option>}
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
            {inviteSuccess && <p className="text-xs text-status-confirmed">Invitación enviada.</p>}
            <Button type="submit" size="sm" disabled={isInviting || roles.length === 0} className="self-start">
              {isInviting ? "Invitando..." : "Invitar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
