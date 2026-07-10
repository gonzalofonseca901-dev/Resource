"use client"

import { useState } from "react"
import type { CancellationPolicy } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

interface CancellationPolicyFormProps {
  policy: CancellationPolicy
  canManage: boolean
}

export function CancellationPolicyForm({ policy, canManage }: CancellationPolicyFormProps) {
  const [minHours, setMinHours] = useState(policy.minHoursBeforeStart)
  // Stored as a fraction (0–1); shown to the user as a percentage.
  const [feePercent, setFeePercent] = useState(Math.round(policy.lateCancellationFeePercent * 100))
  const [chargeNoShow, setChargeNoShow] = useState(policy.chargeNoShow)
  const [note, setNote] = useState(policy.policyNote)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Política de cancelación</CardTitle>
        <p className="text-xs text-muted-foreground">
          Reglas que ven tus clientes al reservar y que aplica el bot automáticamente.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="policy-hours">Horas mínimas para cancelar sin cargo</Label>
            <Input
              id="policy-hours"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={minHours}
              disabled={!canManage}
              onChange={(e) => setMinHours(Number(e.target.value) || 0)}
              className="tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="policy-fee">Cargo por cancelación tardía (%)</Label>
            <Input
              id="policy-fee"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={5}
              value={feePercent}
              disabled={!canManage}
              onChange={(e) => setFeePercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Cobrar ausencias (no-show)</span>
            <span className="text-xs text-muted-foreground">
              Se cobra el turno completo si el cliente no se presenta.
            </span>
          </div>
          <Switch
            checked={chargeNoShow}
            disabled={!canManage}
            onCheckedChange={setChargeNoShow}
            aria-label="Cobrar ausencias"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="policy-note">Nota para clientes</Label>
          <Textarea
            id="policy-note"
            value={note}
            disabled={!canManage}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {canManage && (
          <div className="flex justify-end">
            <Button size="lg">Guardar política</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
