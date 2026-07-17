"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ModuleDefinition, Plan } from "@/lib/types"
import { savePlanAction } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface PlansManagerProps {
  plans: Plan[]
  moduleCatalog: ModuleDefinition[]
}

const EMPTY_FORM = {
  id: undefined as string | undefined,
  key: "",
  name: "",
  description: "",
  price: 0,
  currency: "ARS",
  billingFrequency: "monthly" as "monthly" | "yearly",
  isActive: true,
  moduleKeys: [] as string[],
}

export function PlansManager({ plans, moduleCatalog }: PlansManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function startEdit(plan: Plan) {
    setError(null)
    setForm({
      id: plan.id,
      key: plan.key,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingFrequency: plan.billingFrequency,
      isActive: plan.isActive,
      moduleKeys: plan.moduleKeys,
    })
  }

  function startNew() {
    setError(null)
    setForm(EMPTY_FORM)
  }

  function toggleModuleKey(key: string) {
    setForm((prev) => ({
      ...prev,
      moduleKeys: prev.moduleKeys.includes(key)
        ? prev.moduleKeys.filter((k) => k !== key)
        : [...prev.moduleKeys, key],
    }))
  }

  function handleSave() {
    setError(null)
    if (!form.key.trim() || !form.name.trim()) {
      setError("Key y nombre son obligatorios.")
      return
    }
    // Los módulos core se muestran tildados y disabled en el checklist (no
    // se pueden destildar), pero como nunca pasan por toggleModuleKey nunca
    // entran solos a form.moduleKeys — se agregan acá explícito al guardar,
    // para que el plan nuevo/editado siempre incluya el catálogo core
    // completo (mismo criterio que el seed de la migración 012).
    const requiredKeys = moduleCatalog.filter((m) => m.required).map((m) => m.key)
    const moduleKeys = Array.from(new Set([...form.moduleKeys, ...requiredKeys]))

    startTransition(async () => {
      const result = await savePlanAction({ ...form, moduleKeys })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setForm(EMPTY_FORM)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Catálogo actual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {plan.name} {!plan.isActive && <Badge tone="muted">Inactivo</Badge>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.key} · {plan.currency} {plan.price} · {plan.moduleKeys.length} módulo
                  {plan.moduleKeys.length === 1 ? "" : "s"}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>
                Editar
              </Button>
            </div>
          ))}
          {plans.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay planes cargados.</p>}
          <Button size="sm" variant="outline" onClick={startNew} className="mt-2">
            + Nuevo plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Editar plan" : "Nuevo plan"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Key (única, ej. "pro")
              <Input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Nombre visible
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Descripción
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Precio
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Moneda
              <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Frecuencia
              <Select
                value={form.billingFrequency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, billingFrequency: e.target.value as "monthly" | "yearly" }))
                }
              >
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </Select>
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Módulos incluidos</span>
            <div className="flex flex-col gap-1 rounded-md border border-border p-2">
              {moduleCatalog.map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={form.moduleKeys.includes(mod.key) || Boolean(mod.required)}
                    disabled={mod.required}
                    onChange={() => toggleModuleKey(mod.key)}
                  />
                  {mod.name} {mod.required && <span className="text-xs text-muted-foreground">(core, siempre incluido)</span>}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Plan activo (visible para elegir en /facturacion)
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando..." : form.id ? "Guardar cambios" : "Crear plan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
