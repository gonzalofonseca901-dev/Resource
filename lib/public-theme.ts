// Los 3 temas curados de la landing pública (Sprint 7, decisión ya
// confirmada en el context pack: temas curados, no diseño libre por
// cliente). Cada uno tiene identidad propia (paleta + tipografía + tono de
// texto), pensada para el tipo de negocio que la usa — pero TODOS leen los
// mismos datos reales (`resources`/`schedules`/`bookings` del negocio
// resuelto por subdominio), la personalización es solo la capa visual.
//
// `accentColor` del negocio (guardado en `businesses.settings`, editable
// desde Configuración) se aplica sobre la paleta base de cada tema vía CSS
// var — el tema define la identidad, el accentColor la afina por negocio.

import type { BusinessTheme } from "@/lib/types"

export interface PublicThemeConfig {
  key: BusinessTheme
  label: string
  // Clases de fondo/texto del body.
  bodyClass: string
  // Clases del headline principal del hero.
  headlineClass: string
  // Radio de borde para cards/botones — cada tema tiene una "temperatura" distinta.
  radiusClass: string
  cardClass: string
  buttonClass: string
  eyebrow: string
}

export const PUBLIC_THEMES: Record<BusinessTheme, PublicThemeConfig> = {
  // "Court" — verticales deportivas (pádel, fútbol 5, tenis). Energía de
  // cancha nocturna: verde muy oscuro, líneas de cancha como motivo
  // gráfico, tipografía condensada y en mayúsculas como un marcador.
  court: {
    key: "court",
    label: "Cancha",
    bodyClass: "bg-[#0B1F17] text-[#F3F7F1] font-[family-name:var(--font-court-body)]",
    headlineClass:
      "font-[family-name:var(--font-court-display)] uppercase tracking-tight leading-[0.95]",
    radiusClass: "rounded-sm",
    cardClass: "bg-[#122A20] border border-[#1E3B2C]",
    buttonClass: "rounded-sm uppercase tracking-wide font-semibold",
    eyebrow: "Reservá tu cancha",
  },
  // "Studio" — verticales de bienestar (yoga, spa, salón). Calma, papel
  // crema, serif editorial, mucho aire.
  studio: {
    key: "studio",
    label: "Estudio",
    bodyClass: "bg-[#FBF5EC] text-[#2B2420] font-[family-name:var(--font-studio-body)]",
    headlineClass: "font-[family-name:var(--font-studio-display)] leading-[1.02]",
    radiusClass: "rounded-2xl",
    cardClass: "bg-white border border-[#EBE0D0]",
    buttonClass: "rounded-full font-medium",
    eyebrow: "Reservá tu turno",
  },
  // "Clinic" — verticales profesionales (consultorios, estética médica).
  // Precisión clínica: blanco, grilla marcada, grotesca ajustada.
  clinic: {
    key: "clinic",
    label: "Consultorio",
    bodyClass: "bg-white text-[#0F1B2E] font-[family-name:var(--font-clinic-body)]",
    headlineClass: "font-[family-name:var(--font-clinic-display)] tracking-tight leading-[1.0]",
    radiusClass: "rounded-md",
    cardClass: "bg-[#F7F9FC] border border-[#DCE3EE]",
    buttonClass: "rounded-md font-semibold",
    eyebrow: "Reservá tu turno",
  },
}

export function getPublicTheme(theme: BusinessTheme): PublicThemeConfig {
  return PUBLIC_THEMES[theme] ?? PUBLIC_THEMES.court
}
