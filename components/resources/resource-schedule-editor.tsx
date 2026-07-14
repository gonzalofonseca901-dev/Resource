"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import type { DayOfWeek, Schedule, ScheduleBlock } from "@/lib/types"
import { formatDayOfWeek, formatDateShort, formatTimeRange } from "@/lib/date-utils"
import { tempId } from "@/lib/utils"
import { saveSchedulesAction, createBlockAction, deleteBlockAction } from "@/lib/actions/resources"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// Monday-first order for the weekly grid.
const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

interface ResourceScheduleEditorProps {
  resourceId: string
  schedules: Schedule[]
  blocks: ScheduleBlock[]
  canManage: boolean
}

interface BlockDraft {
  date: string
  fromTime: string
  toTime: string
  reason: string
}

function emptyBlockDraft(): BlockDraft {
  return { date: "", fromTime: "09:00", toTime: "22:00", reason: "" }
}

export function ResourceScheduleEditor({
  resourceId,
  schedules: initial,
  blocks,
  canManage,
}: ResourceScheduleEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [schedules, setSchedules] = useState<Schedule[]>(initial)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addingBlock, setAddingBlock] = useState(false)
  const [blockDraft, setBlockDraft] = useState<BlockDraft>(emptyBlockDraft())

  // Ensure there is a row per weekday so staff can enable a currently-closed day.
  const rows = DAY_ORDER.map((day) => {
    const existing = schedules.find((s) => s.dayOfWeek === day)
    return (
      existing ?? {
        id: tempId("sch"),
        resourceId,
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "22:00",
        slotDurationMin: 90,
        isActive: false,
      }
    )
  })

  function update(day: DayOfWeek, patch: Partial<Schedule>) {
    setDirty(true)
    setSchedules((prev) => {
      const found = prev.find((s) => s.dayOfWeek === day)
      if (found) {
        return prev.map((s) => (s.dayOfWeek === day ? { ...s, ...patch } : s))
      }
      const base = rows.find((r) => r.dayOfWeek === day)!
      return [...prev, { ...base, ...patch }]
    })
  }

  function handleSaveSchedules() {
    setError(null)
    startTransition(async () => {
      const result = await saveSchedulesAction(resourceId, rows)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDirty(false)
      router.refresh()
    })
  }

  const blockValid = blockDraft.date !== "" && blockDraft.toTime > blockDraft.fromTime

  function handleAddBlock() {
    if (!blockValid) return
    setError(null)
    startTransition(async () => {
      const result = await createBlockAction(resourceId, {
        startsAt: new Date(`${blockDraft.date}T${blockDraft.fromTime}`).toISOString(),
        endsAt: new Date(`${blockDraft.date}T${blockDraft.toTime}`).toISOString(),
        reason: blockDraft.reason.trim(),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setAddingBlock(false)
      setBlockDraft(emptyBlockDraft())
      router.refresh()
    })
  }

  function handleDeleteBlock(blockId: string) {
    setError(null)
    startTransition(async () => {
      const result = await deleteBlockAction(blockId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">Horario de atención</h3>
          <p className="text-xs text-muted-foreground">
            Definí los días y franjas en que el recurso acepta reservas, y la duración de cada
            turno.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Día</th>
                <th className="px-3 py-2 text-left font-medium">Abre</th>
                <th className="px-3 py-2 text-left font-medium">Cierra</th>
                <th className="px-3 py-2 text-left font-medium">Turno (min)</th>
                <th className="px-3 py-2 text-right font-medium">Abierto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.dayOfWeek} className="border-t border-border">
                  <td className="px-3 py-2 capitalize">{formatDayOfWeek(row.dayOfWeek)}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      aria-label={`Apertura ${formatDayOfWeek(row.dayOfWeek)}`}
                      value={row.openTime}
                      disabled={!canManage || !row.isActive}
                      onChange={(e) => update(row.dayOfWeek, { openTime: e.target.value })}
                      className="h-8 w-28"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      aria-label={`Cierre ${formatDayOfWeek(row.dayOfWeek)}`}
                      value={row.closeTime}
                      disabled={!canManage || !row.isActive}
                      onChange={(e) => update(row.dayOfWeek, { closeTime: e.target.value })}
                      className="h-8 w-28"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={15}
                      step={15}
                      aria-label={`Duración de turno ${formatDayOfWeek(row.dayOfWeek)}`}
                      value={row.slotDurationMin}
                      disabled={!canManage || !row.isActive}
                      onChange={(e) =>
                        update(row.dayOfWeek, { slotDurationMin: Number(e.target.value) || 0 })
                      }
                      className="h-8 w-20 tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Switch
                        checked={row.isActive}
                        disabled={!canManage}
                        aria-label={`Abrir ${formatDayOfWeek(row.dayOfWeek)}`}
                        onCheckedChange={(v) => update(row.dayOfWeek, { isActive: v })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canManage && (
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveSchedules} disabled={!dirty || isPending}>
              {isPending ? "Guardando..." : "Guardar horarios"}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-medium">Bloqueos y excepciones</h3>
            <p className="text-xs text-muted-foreground">
              Fechas puntuales en que el recurso no está disponible (mantenimiento, eventos).
            </p>
          </div>
          {canManage && !addingBlock && (
            <Button variant="outline" size="sm" onClick={() => setAddingBlock(true)}>
              <Plus className="size-3.5" aria-hidden="true" />
              Nuevo bloqueo
            </Button>
          )}
        </div>

        {addingBlock && canManage && (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/30 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="block-date">Fecha</Label>
                <Input
                  id="block-date"
                  type="date"
                  value={blockDraft.date}
                  onChange={(e) => setBlockDraft((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="block-from">Desde</Label>
                <Input
                  id="block-from"
                  type="time"
                  value={blockDraft.fromTime}
                  onChange={(e) => setBlockDraft((p) => ({ ...p, fromTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="block-to">Hasta</Label>
                <Input
                  id="block-to"
                  type="time"
                  value={blockDraft.toTime}
                  onChange={(e) => setBlockDraft((p) => ({ ...p, toTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="block-reason">Motivo</Label>
              <Input
                id="block-reason"
                value={blockDraft.reason}
                placeholder="Mantenimiento de red, evento privado…"
                onChange={(e) => setBlockDraft((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddingBlock(false)
                  setBlockDraft(emptyBlockDraft())
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAddBlock} disabled={!blockValid || isPending}>
                {isPending ? "Guardando..." : "Agregar bloqueo"}
              </Button>
            </div>
          </div>
        )}

        {blocks.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Sin bloqueos programados.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{block.reason || "Sin motivo especificado"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateShort(block.startsAt)} · {formatTimeRange(block.startsAt, block.endsAt)}
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar bloqueo"
                    onClick={() => handleDeleteBlock(block.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
