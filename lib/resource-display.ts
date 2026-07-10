// Presentation metadata for resource + pricing enums: Spanish labels centralized
// so the Recursos views never duplicate these mappings.

import type { PricingRuleType, ResourceType } from "@/lib/types"

export const RESOURCE_TYPE_META: Record<ResourceType, string> = {
  court: "Cancha",
  room: "Sala",
  seat: "Sillón",
  table: "Mesa",
  other: "Otro",
}

export const PRICING_RULE_META: Record<PricingRuleType, { label: string; hint: string }> = {
  base: { label: "Precio base", hint: "Se aplica cuando ninguna otra regla coincide." },
  day_of_week: { label: "Por día", hint: "Precio especial para un día de la semana." },
  time_range: { label: "Por franja", hint: "Precio para un rango horario." },
  specific_date: { label: "Fecha puntual", hint: "Precio para una fecha específica." },
}
