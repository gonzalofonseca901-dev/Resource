"use client"

import { useState } from "react"
import type { Business, BusinessVertical } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const VERTICAL_LABELS: Record<BusinessVertical, string> = {
  padel: "Pádel",
  studio: "Estudio",
  clinic: "Clínica / Consultorio",
  other: "Otro",
}

interface BusinessInfoFormProps {
  business: Business
  canManage: boolean
}

export function BusinessInfoForm({ business, canManage }: BusinessInfoFormProps) {
  const [name, setName] = useState(business.name)
  const [slug, setSlug] = useState(business.slug)
  const [vertical, setVertical] = useState<BusinessVertical>(business.vertical)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del negocio</CardTitle>
        <p className="text-xs text-muted-foreground">
          Nombre comercial, identificador público y rubro principal.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biz-name">Nombre</Label>
          <Input
            id="biz-name"
            value={name}
            disabled={!canManage}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biz-slug">Identificador (slug)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">reservas.app/</span>
            <Input
              id="biz-slug"
              value={slug}
              disabled={!canManage}
              onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())}
              className="font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Es la dirección pública donde tus clientes reservan.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biz-vertical">Rubro</Label>
          <Select
            id="biz-vertical"
            value={vertical}
            disabled={!canManage}
            onChange={(e) => setVertical(e.target.value as BusinessVertical)}
          >
            {(Object.keys(VERTICAL_LABELS) as BusinessVertical[]).map((v) => (
              <option key={v} value={v}>
                {VERTICAL_LABELS[v]}
              </option>
            ))}
          </Select>
        </div>

        {canManage && (
          <div className="flex justify-end">
            <Button size="lg">Guardar cambios</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
