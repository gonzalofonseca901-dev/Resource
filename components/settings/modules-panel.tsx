"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ModuleDefinition } from "@/lib/types"
import { toggleModuleAction } from "@/lib/actions/business"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface ModulesPanelProps {
  modules: ModuleDefinition[]
  enabledKeys: string[]
}

export function ModulesPanel({ modules, enabledKeys }: ModulesPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledKeys))
  const [error, setError] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  function toggle(key: string, on: boolean) {
    setError(null)
    setPendingKey(key)
    // Optimista: se ve el cambio al toque, se revierte si falla.
    setEnabled((prev) => {
      const next = new Set(prev)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
    startTransition(async () => {
      const result = await toggleModuleAction(key, on)
      setPendingKey(null)
      if (!result.ok) {
        setError(result.error)
        setEnabled((prev) => {
          const next = new Set(prev)
          if (on) next.delete(key)
          else next.add(key)
          return next
        })
        return
      }
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos de la plataforma</CardTitle>
        <p className="text-xs text-muted-foreground">
          Activá o desactivá funcionalidades. Los módulos base no se pueden desactivar.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {modules.map((module) => {
            const isOn = module.required || enabled.has(module.key)
            return (
              <li
                key={module.key}
                className="flex items-start justify-between gap-4 rounded-md border border-border px-3 py-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{module.name}</span>
                    {module.required && <Badge tone="muted">Base</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground text-pretty">{module.description}</p>
                </div>
                <Switch
                  checked={isOn}
                  disabled={module.required || (isPending && pendingKey === module.key)}
                  aria-label={`Activar módulo ${module.name}`}
                  onCheckedChange={(v) => toggle(module.key, v)}
                />
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
