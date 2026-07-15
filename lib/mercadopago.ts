// Wrapper delgado sobre la REST API de Mercado Pago para la suscripción
// NEGOCIO → PLATAFORMA (Sprint 6, Parte A). Usa "Preapproval" (suscripciones
// con monto recurrente fijo), no "Preference" (checkout de pago suelto) ni
// Split Payments/Marketplace (eso es Sprint 10, integración aparte).
//
// Se llama directo a fetch en vez de instalar el SDK oficial `mercadopago`
// a propósito: la superficie que necesitamos acá es chica (crear/leer un
// preapproval) y evita atarnos a la versión del SDK — si el equipo prefiere
// el SDK más adelante, este archivo es el único lugar a tocar.
//
// Requiere MERCADOPAGO_ACCESS_TOKEN (Access Token de PRODUCCIÓN o TEST según
// el ambiente, de la cuenta de Mercado Pago de LA AGENCIA — es la cuenta que
// cobra la suscripción SaaS, no la de cada negocio cliente).

const MP_API_BASE = "https://api.mercadopago.com"

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en las env vars del server.")
  return token
}

export interface CreatePreapprovalInput {
  reason: string // texto visible al pagador, ej. "Recursos — Plan Pro"
  payerEmail: string
  amount: number
  currencyId: string // "ARS"
  frequency: number // 1
  frequencyType: "months" | "days"
  externalReference: string // subscriptionId propio, para matchear el webhook
  backUrl: string // a dónde vuelve el usuario tras autorizar
}

export interface MpPreapproval {
  id: string
  status: string // 'pending' | 'authorized' | 'paused' | 'cancelled'
  init_point?: string
  external_reference?: string
  payer_email?: string
  auto_recurring?: {
    frequency: number
    frequency_type: string
    transaction_amount: number
    currency_id: string
  }
}

/** Crea una suscripción (preapproval) y devuelve el init_point para redirigir al pagador a autorizarla. */
export async function createPreapproval(input: CreatePreapprovalInput): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: input.amount,
        currency_id: input.currencyId,
      },
      status: "pending",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mercado Pago rechazó la creación del preapproval (${res.status}): ${body}`)
  }

  return res.json()
}

/** Trae el estado actual de un preapproval — usado por el webhook para confirmar antes de escribir en la DB. */
export async function getPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API_BASE}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`No se pudo leer el preapproval ${id} (${res.status}): ${body}`)
  }

  return res.json()
}

export interface MpPayment {
  id: number
  status: string // 'approved' | 'rejected' | 'pending' | ...
  external_reference?: string
}

/** Trae el estado de un pago puntual — la notificación type=payment del webhook solo trae el id. */
export async function getPayment(id: string): Promise<MpPayment> {
  const res = await fetch(`${MP_API_BASE}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`No se pudo leer el pago ${id} (${res.status}): ${body}`)
  }

  return res.json()
}
