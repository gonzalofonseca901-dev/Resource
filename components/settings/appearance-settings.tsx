"use client"

import { useRef, useState } from "react"
import { Check, ImageIcon, Upload } from "lucide-react"
import type { BusinessSettings, BusinessTheme } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const THEME_OPTIONS: { key: BusinessTheme; label: string; hint: string }[] = [
  { key: "court", label: "Cancha", hint: "Verde deportivo, para pádel y clubes." },
  { key: "studio", label: "Estudio", hint: "Cálido y minimalista, para estudios." },
  { key: "clinic", label: "Clínica", hint: "Sobrio y limpio, para consultorios." },
]

// Preset accent swatches per theme mood; owners can also pick a custom color.
const ACCENT_PRESETS = ["#147D7A", "#0F766E", "#2563EB", "#DB2777", "#D97706", "#4F46E5"]

interface AppearanceSettingsProps {
  settings: BusinessSettings
  canManage: boolean
}

export function AppearanceSettings({ settings, canManage }: AppearanceSettingsProps) {
  // Local draft matches business.settings exactly (theme / accentColor / logoUrl),
  // which is what the future public landing will read.
  const [theme, setTheme] = useState<BusinessTheme>(settings.theme)
  const [accentColor, setAccentColor] = useState(settings.accentColor)
  const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.logoUrl)
  const fileRef = useRef<HTMLInputElement>(null)

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setLogoUrl(URL.createObjectURL(file))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <p className="text-xs text-muted-foreground">
          Tema, color de acento y logo. Es lo que verán tus clientes en el sitio público.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2" disabled={!canManage}>
          <legend className="mb-1 text-xs font-medium text-foreground">Tema</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const active = theme === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={active}
                  disabled={!canManage}
                  onClick={() => setTheme(option.key)}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    active
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-secondary/50",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-medium">{option.label}</span>
                    {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                  </span>
                  <span className="text-xs text-muted-foreground text-pretty">{option.hint}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="accent-color">Color de acento</Label>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const active = accentColor.toLowerCase() === preset.toLowerCase()
              return (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Usar color ${preset}`}
                  aria-pressed={active}
                  disabled={!canManage}
                  onClick={() => setAccentColor(preset)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border transition-transform disabled:cursor-not-allowed disabled:opacity-60",
                    active ? "border-foreground ring-2 ring-ring/40" : "border-border",
                  )}
                  style={{ backgroundColor: preset }}
                >
                  {active && <Check className="size-4 text-white" aria-hidden="true" />}
                </button>
              )
            })}
            <label className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
              <input
                id="accent-color"
                type="color"
                value={accentColor}
                disabled={!canManage}
                onChange={(e) => setAccentColor(e.target.value)}
                className="size-6 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              />
              <span className="font-mono text-xs text-muted-foreground">{accentColor.toUpperCase()}</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/40">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl || "/placeholder.svg"} alt="Logo del negocio" className="size-full object-contain" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              )}
            </span>
            {canManage && (
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onLogoChange}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-3.5" aria-hidden="true" />
                  Subir logo
                </Button>
                {logoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setLogoUrl(undefined)}>
                    Quitar
                  </Button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG o SVG con fondo transparente, ideal cuadrado.</p>
        </div>

        {canManage && (
          <div className="flex justify-end">
            <Button size="lg">Guardar apariencia</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
