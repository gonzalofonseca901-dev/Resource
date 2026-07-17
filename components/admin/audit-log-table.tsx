"use client"

import { useMemo, useState } from "react"
import type { AdminAuditLogEntry } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface AuditLogTableProps {
  entries: AdminAuditLogEntry[]
}

// Columnas mostradas en genérico (no hardcodeamos "action"/"table_name"/etc.
// porque no tenemos el archivo real de la migración de audit_log en este
// chat — se arman a partir de las keys que efectivamente vengan en la
// primera fila, así esto no rompe si el nombre real de alguna columna es
// distinto al que uno esperaría). `business_id` se excluye porque ya se
// muestra resuelto a nombre en la columna "Negocio".
const HIDDEN_KEYS = new Set(["business_id"])

export function AuditLogTable({ entries }: AuditLogTableProps) {
  const [query, setQuery] = useState("")

  const columns = useMemo(() => {
    const keys = new Set<string>()
    for (const e of entries) for (const k of Object.keys(e.raw)) if (!HIDDEN_KEYS.has(k)) keys.add(k)
    // created_at primero si existe, el resto en el orden en que aparecieron.
    return Array.from(keys).sort((a, b) => (a === "created_at" ? -1 : b === "created_at" ? 1 : 0))
  }, [entries])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => JSON.stringify(e.raw).toLowerCase().includes(q) || e.businessName?.toLowerCase().includes(q))
  }, [entries, query])

  function renderValue(value: unknown): string {
    if (value === null || value === undefined) return "—"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar en cualquier campo o negocio..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Negocio</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{entry.businessName ?? "—"}</td>
                {columns.map((col) => (
                  <td key={col} className="max-w-xs truncate px-3 py-2 text-muted-foreground" title={renderValue(entry.raw[col])}>
                    {renderValue(entry.raw[col])}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                  No hay eventos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
