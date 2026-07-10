"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TabItem {
  key: string
  label: string
  icon?: LucideIcon
}

interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (key: string) => void
  "aria-label"?: string
}

/**
 * Horizontal, scrollable tab bar with an underline indicator (court-line
 * aesthetic). Presentational — the parent owns the active key and renders the
 * matching panel.
 */
export function Tabs({ items, value, onValueChange, ...props }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      className="flex items-center gap-1 overflow-x-auto border-b border-border"
    >
      {items.map((item) => {
        const active = item.key === value
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
