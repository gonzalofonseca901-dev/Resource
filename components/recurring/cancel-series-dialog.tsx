"use client"

import { useEffect, useState } from "react"
import type { EnrichedRecurringBooking } from "@/lib/data"
import { formatDayOfWeek } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export type SeriesCancellation =
  | { scope: "series"; seriesId: string }
  | { scope: "occurrence"; seriesId: string; date: string }

type Scope = "series" | "occurrence"

interface CancelSeriesDialogProps {
  series: EnrichedRecurringBooking | null
  onClose: () => void
  onConfirm: (result: SeriesCancellation) => void
  submitting?: boolean
}

export function CancelSeriesDialog({
  series,
  onClose,
  onConfirm,
  submitting = false,
}: CancelSeriesDialogProps) {
  const [scope, setScope] = useState<Scope>("series")
  const [date, setDate] = useState("")

  useEffect(() => {
    if (series) {
      setScope("series")
      setDate(series.validFrom)
    }
  }, [series])

  const isValid = scope === "series" || (scope === "occurrence" && date !== "")

  function handleConfirm() {
    if (!series || !isValid) return
    onConfirm(
      scope === "series"
        ? { scope: "series", seriesId: series.id }
        : { scope: "occurrence", seriesId: series.id, date },
    )
  }

  const options: { value: Scope; title: string; description: string }[] = [
    {
      value: "series",
      title: "Toda la serie",
      description: "Da de baja el turno fijo para todas las semanas futuras.",
    },
    {
      value: "occurrence",
      title: "Una fecha puntual",
      description: "Cancela solo un día; el resto de la serie sigue activa.",
    },
  ]

  return (
    <Modal
      open={series !== null}
      onClose={onClose}
      title="Dar de baja turno fijo"
      description={
        series
          ? `${series.client.fullName} · ${formatDayOfWeek(series.dayOfWeek)} ${series.startTime}–${series.endTime}`
          : undefined
      }
      footer={
        <>
          <Button variant="outline" size="lg" onClick={onClose} disabled={submitting}>
            Volver
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleConfirm}
            disabled={!isValid || submitting}
          >
            {submitting ? "Confirmando..." : "Confirmar baja"}
          </Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Alcance de la baja</legend>
        {options.map((option) => {
          const active = scope === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/50",
              )}
            >
              <input
                type="radio"
                name="cancel-scope"
                value={option.value}
                checked={active}
                onChange={() => setScope(option.value)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{option.title}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          )
        })}
      </fieldset>

      {scope === "occurrence" && (
        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="cancel-date">Fecha a cancelar</Label>
          <Input
            id="cancel-date"
            type="date"
            value={date}
            min={series?.validFrom}
            max={series?.validUntil}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}
