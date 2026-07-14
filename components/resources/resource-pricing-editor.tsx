"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"
import type { Currency, DayOfWeek, PricingRuleType, ResourcePricing } from "@/lib/types"
import { PRICING_RULE_META } from "@/lib/resource-display"
import { formatCurrency, formatDayOfWeek } from "@/lib/date-utils"
import { tempId } from "@/lib/utils"
import { upsertPricingRuleAction, deletePricingRuleAction } from "@/lib/actions/resources"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

// Monday-first order for the day picker (values are 0=Sun..6=Sat).
const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

// Default priority per rule type so the resolution order (specific date >
// day of week > time range > base) is reflected out of the box. Owners can
// still fine-tune the numeric priority per rule.
const DEFAULT_PRIORITY: Record<PricingRuleType, number> = {
  specific_date: 30,
  day_of_week: 20,
  time_range: 15,
  base: 0,
}

interface PricingDraft {
  id?: string
  ruleType: PricingRuleType
  dayOfWeek: DayOfWeek
  fromTime: string
  toTime: string
  specificDate: string
  price: number
  currency: Currency
  priority: number
}

function newDraft(): PricingDraft {
  return {
    ruleType: "day_of_week",
    dayOfWeek: 6,
    fromTime: "18:00",
    toTime: "23:00",
    specificDate: "",
    price: 12000,
    currency: "ARS",
    priority: DEFAULT_PRIORITY.day_of_week,
  }
}

function toDraft(rule: ResourcePricing): PricingDraft {
  return {
    id: rule.id,
    ruleType: rule.ruleType,
    dayOfWeek: rule.dayOfWeek ?? 6,
    fromTime: rule.fromTime ?? "18:00",
    toTime: rule.toTime ?? "23:00",
    specificDate: rule.specificDate ?? "",
    price: rule.price,
    currency: rule.currency,
    priority: rule.priority,
  }
}

/** "12/07/2026" from a "YYYY-MM-DD" date-only string (tz-safe). */
function formatSpecificDate(value: string): string {
  const [y, m, d] = value.split("-")
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

/** Human-readable summary of what a rule matches. */
function describeScope(rule: ResourcePricing): string {
  switch (rule.ruleType) {
    case "specific_date":
      return rule.specificDate ? formatSpecificDate(rule.specificDate) : "Fecha sin definir"
    case "day_of_week":
      return rule.dayOfWeek != null ? `Todos los ${formatDayOfWeek(rule.dayOfWeek)}` : "Día sin definir"
    case "time_range":
      return rule.fromTime && rule.toTime ? `${rule.fromTime} – ${rule.toTime}` : "Franja sin definir"
    case "base":
      return "Cualquier turno"
  }
}

interface ResourcePricingEditorProps {
  resourceId: string
  pricing: ResourcePricing[]
  canManage: boolean
}

export function ResourcePricingEditor({
  resourceId,
  pricing: rules,
  canManage,
}: ResourcePricingEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<PricingDraft | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Highest priority first — this is the order the engine evaluates rules in.
  const sorted = useMemo(
    () => [...rules].sort((a, b) => b.priority - a.priority),
    [rules],
  )

  function set<K extends keyof PricingDraft>(key: K, value: PricingDraft[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function startCreate() {
    setError(null)
    setDraft(newDraft())
  }

  function startEdit(rule: ResourcePricing) {
    setError(null)
    setDraft(toDraft(rule))
  }

  function changeRuleType(ruleType: PricingRuleType) {
    setDraft((prev) =>
      prev ? { ...prev, ruleType, priority: DEFAULT_PRIORITY[ruleType] } : prev,
    )
  }

  const isValid = draft != null && draft.price >= 0 &&
    (draft.ruleType !== "specific_date" || draft.specificDate !== "") &&
    (draft.ruleType !== "time_range" || (draft.fromTime !== "" && draft.toTime !== "" && draft.toTime > draft.fromTime))

  function save() {
    if (!draft || !isValid) return
    const rule: ResourcePricing = {
      id: draft.id ?? tempId("price"),
      resourceId,
      ruleType: draft.ruleType,
      price: Number(draft.price) || 0,
      currency: draft.currency,
      priority: Number(draft.priority) || 0,
      dayOfWeek: draft.ruleType === "day_of_week" ? draft.dayOfWeek : undefined,
      fromTime: draft.ruleType === "time_range" ? draft.fromTime : undefined,
      toTime: draft.ruleType === "time_range" ? draft.toTime : undefined,
      specificDate: draft.ruleType === "specific_date" ? draft.specificDate : undefined,
    }
    setError(null)
    startTransition(async () => {
      const result = await upsertPricingRuleAction(resourceId, rule)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraft(null)
      router.refresh()
    })
  }

  function remove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await deletePricingRuleAction(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">Precios variables</h3>
          <p className="text-xs text-muted-foreground text-pretty">
            Se evalúan de mayor a menor prioridad: una <strong>fecha puntual</strong> gana sobre un{" "}
            <strong>día de la semana</strong>, que a su vez gana sobre el <strong>precio base</strong>.
          </p>
        </div>
        {canManage && !draft && (
          <Button variant="outline" size="sm" onClick={startCreate} disabled={isPending}>
            <Plus className="size-3.5" aria-hidden="true" />
            Nueva regla
          </Button>
        )}
      </div>

      {draft && canManage && (
        <div className="flex flex-col gap-4 rounded-md border border-border bg-secondary/30 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-type">Tipo de regla</Label>
              <Select
                id="price-type"
                value={draft.ruleType}
                onChange={(e) => changeRuleType(e.target.value as PricingRuleType)}
              >
                {(Object.keys(PRICING_RULE_META) as PricingRuleType[]).map((type) => (
                  <option key={type} value={type}>
                    {PRICING_RULE_META[type].label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">{PRICING_RULE_META[draft.ruleType].hint}</p>
            </div>

            {draft.ruleType === "day_of_week" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price-day">Día de la semana</Label>
                <Select
                  id="price-day"
                  value={String(draft.dayOfWeek)}
                  onChange={(e) => set("dayOfWeek", Number(e.target.value) as DayOfWeek)}
                >
                  {DAY_ORDER.map((day) => (
                    <option key={day} value={day} className="capitalize">
                      {formatDayOfWeek(day)}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {draft.ruleType === "specific_date" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price-date">Fecha</Label>
                <Input
                  id="price-date"
                  type="date"
                  value={draft.specificDate}
                  onChange={(e) => set("specificDate", e.target.value)}
                />
              </div>
            )}

            {draft.ruleType === "time_range" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="price-from">Desde</Label>
                  <Input
                    id="price-from"
                    type="time"
                    value={draft.fromTime}
                    onChange={(e) => set("fromTime", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="price-to">Hasta</Label>
                  <Input
                    id="price-to"
                    type="time"
                    value={draft.toTime}
                    onChange={(e) => set("toTime", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-amount">Precio</Label>
              <Input
                id="price-amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={500}
                value={draft.price}
                onChange={(e) => set("price", Number(e.target.value) || 0)}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-currency">Moneda</Label>
              <Select
                id="price-currency"
                value={draft.currency}
                onChange={(e) => set("currency", e.target.value as Currency)}
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (US$)</option>
                <option value="EUR">EUR (€)</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price-priority">Prioridad</Label>
              <Input
                id="price-priority"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={draft.priority}
                onChange={(e) => set("priority", Number(e.target.value) || 0)}
                className="tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={save} disabled={!isValid || isPending}>
              {isPending ? "Guardando..." : draft.id ? "Guardar regla" : "Agregar regla"}
            </Button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          Sin reglas de precio. Agregá al menos un precio base.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {sorted.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={rule.ruleType === "base" ? "muted" : "default"}>
                    {PRICING_RULE_META[rule.ruleType].label}
                  </Badge>
                  <span className="truncate text-sm">{describeScope(rule)}</span>
                </div>
                <span className="text-xs text-muted-foreground">Prioridad {rule.priority}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(rule.price, rule.currency)}
                </span>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar regla ${PRICING_RULE_META[rule.ruleType].label}`}
                      onClick={() => startEdit(rule)}
                      disabled={isPending}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar regla ${PRICING_RULE_META[rule.ruleType].label}`}
                      onClick={() => remove(rule.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
