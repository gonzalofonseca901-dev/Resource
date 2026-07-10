"use client"

import { useState } from "react"
import type { ModuleDefinition } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface ModulesPanelProps {
  modules: ModuleDefinition[]
  enabledKeys: string[]
}

export function ModulesPanel({ modules, enabledKeys }: ModulesPanelProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledKeys))

  function toggle(key: string, on: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (on) next.add(key)
      else next.delete(key)
      return next
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
      <CardContent>
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
                  disabled={module.required}
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
