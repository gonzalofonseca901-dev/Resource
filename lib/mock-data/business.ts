import type { Business, Location, ModuleDefinition } from "@/lib/types"

export const MOCK_BUSINESS: Business = {
  id: "biz-padel-norte",
  slug: "padel-norte",
  name: "Pádel Norte",
  vertical: "padel",
  legalName: "Pádel Norte S.R.L.",
  taxId: "30-71234567-8",
  email: "hola@padelnorte.com.ar",
  phone: "+54 11 4747-1200",
  modulesEnabled: ["bookings", "pricing", "clients", "recurring", "reports"],
  cancellationPolicy: {
    minHoursBeforeStart: 12,
    lateCancellationFeePercent: 0.5,
    chargeNoShow: true,
    policyNote:
      "Podés cancelar sin cargo hasta 12 horas antes del turno. Cancelaciones tardías tienen un cargo del 50% y las ausencias se cobran completas.",
  },
  settings: {
    theme: "court",
    accentColor: "#147D7A",
    logoUrl: undefined,
  },
}

/**
 * Static catalog of product modules. Which of these are active for a business
 * is decided by `business.modulesEnabled`; this list only describes them.
 */
export const MODULE_CATALOG: ModuleDefinition[] = [
  {
    key: "bookings",
    name: "Reservas",
    description: "Motor de reservas, agenda y estados de turno. Es la base de la plataforma.",
    required: true,
  },
  {
    key: "pricing",
    name: "Precios variables",
    description: "Reglas de precio por día, franja horaria y fecha puntual para cada recurso.",
  },
  {
    key: "clients",
    name: "Clientes",
    description: "Ficha de clientes, historial de reservas y puntos de fidelidad.",
  },
  {
    key: "recurring",
    name: "Turnos fijos",
    description: "Series recurrentes semanales con excepciones puntuales.",
  },
  {
    key: "reports",
    name: "Analítica",
    description: "Ocupación, ingresos, retención y ausencias del complejo.",
  },
  {
    key: "whatsapp_bot",
    name: "Bot de WhatsApp",
    description: "Canal principal de reservas por WhatsApp con IA. Próximamente.",
  },
]

export const MOCK_LOCATIONS: Location[] = [
  {
    id: "loc-centro",
    businessId: "biz-padel-norte",
    name: "Pádel Norte - Centro",
    address: "Av. San Martín 1240",
    city: "San Isidro",
    phone: "+54 11 4747-1200",
    whatsappNumber: "+54 9 11 4747-1200",
    timezone: "America/Argentina/Buenos_Aires",
    isActive: true,
  },
  {
    id: "loc-costanera",
    businessId: "biz-padel-norte",
    name: "Pádel Norte - Costanera",
    address: "Camino de la Ribera 850",
    city: "Vicente López",
    phone: "+54 11 4760-3300",
    whatsappNumber: "+54 9 11 4760-3300",
    timezone: "America/Argentina/Buenos_Aires",
    isActive: true,
  },
]
