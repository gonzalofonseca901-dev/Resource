// Presentation metadata for booking enums: Spanish labels + the design token
// used to color them. Centralized so dashboard, agenda and future views never
// duplicate this mapping.

import type {
  BookingSource,
  BookingStatus,
  PaymentStatus,
  PreferredChannel,
  RecurringBookingStatus,
} from "@/lib/types"

interface StatusMeta {
  label: string
  // Tailwind token color name (see globals.css --color-status-*).
  token: string
}

export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  confirmed: { label: "Confirmada", token: "status-confirmed" },
  pending: { label: "Pendiente", token: "status-pending" },
  cancelled: { label: "Cancelada", token: "status-cancelled" },
  completed: { label: "Completada", token: "status-completed" },
  no_show: { label: "No asistió", token: "status-no-show" },
}

export const SOURCE_META: Record<BookingSource, string> = {
  whatsapp_bot: "WhatsApp",
  web: "Web",
  backoffice_manual: "Mostrador",
}

export const PAYMENT_META: Record<PaymentStatus, string> = {
  pending: "Sin pagar",
  partial: "Seña",
  paid: "Pagado",
  cancelled: "Anulado",
}

export const CHANNEL_META: Record<PreferredChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  phone: "Teléfono",
}

interface RecurringStatusMeta {
  label: string
  // Reuses the booking-status design tokens (see globals.css --color-status-*).
  token: string
}

export const RECURRING_STATUS_META: Record<RecurringBookingStatus, RecurringStatusMeta> = {
  active: { label: "Activo", token: "status-confirmed" },
  paused: { label: "Pausado", token: "status-pending" },
  cancelled: { label: "Cancelado", token: "status-cancelled" },
}
