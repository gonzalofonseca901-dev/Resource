"use client"

import { Phone, Mail, Globe, MessageCircle, Star, UserRound, CalendarClock, MapPin } from "lucide-react"
import type { EnrichedBooking } from "@/lib/data"
import type { EndClient } from "@/lib/types"
import { formatCurrency, formatDateShort, formatTimeRange } from "@/lib/date-utils"
import { CHANNEL_META } from "@/lib/booking-display"
import { StatusBadge } from "@/components/booking/status-badge"

interface ClientDetailProps {
  client: EndClient | null
  bookings: EnrichedBooking[]
  canManage: boolean
}

export function ClientDetail({ client, bookings, canManage }: ClientDetailProps) {
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
        <UserRound className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Seleccioná un cliente</p>
        <p className="text-sm text-muted-foreground">
          Elegí un cliente de la lista para ver sus datos e historial.
        </p>
      </div>
    )
  }

  const now = Date.now()
  const activeBookings = bookings.filter((b) => b.status !== "cancelled")
  const totalSpent = activeBookings
    .filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "partial")
    .reduce((sum, b) => sum + b.price, 0)
  const upcoming = activeBookings.filter((b) => new Date(b.startsAt).getTime() > now).length

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-hidden="true"
            >
              {getInitials(client.fullName)}
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">{client.fullName}</h2>
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {channelIcon(client.preferredChannel)}
                Prefiere {CHANNEL_META[client.preferredChannel]}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
            <Star className="size-3.5 text-status-pending" aria-hidden="true" />
            <span className="tabular-nums">{client.loyaltyPoints}</span> pts
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ContactRow icon={<Phone className="size-4" aria-hidden="true" />} label="Teléfono">
            <span className="font-mono tabular-nums">{client.phone}</span>
          </ContactRow>
          <ContactRow icon={<Mail className="size-4" aria-hidden="true" />} label="Email">
            {client.email ?? <span className="text-muted-foreground">Sin email</span>}
          </ContactRow>
        </dl>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
          <Stat label="Reservas" value={String(activeBookings.length)} />
          <Stat label="Próximas" value={String(upcoming)} />
          <Stat label="Gastado" value={formatCurrency(totalSpent)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">Historial de reservas</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{bookings.length}</span>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <CalendarClock className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Sin reservas</p>
            <p className="text-sm text-muted-foreground">
              Este cliente todavía no tiene reservas registradas.
            </p>
          </div>
        ) : (
          <ul className="max-h-[24rem] divide-y divide-border overflow-y-auto">
            {bookings.map((booking) => (
              <li key={booking.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium tabular-nums">
                      {formatDateShort(booking.startsAt)}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {formatTimeRange(booking.startsAt, booking.endsAt)}
                    </span>
                    {" · "}
                    {booking.resource.name}
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      <MapPin className="size-3" aria-hidden="true" />
                      {booking.location.city}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm tabular-nums">
                  {formatCurrency(booking.price)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManage && (
        <p className="px-1 text-xs text-muted-foreground">
          Tenés permisos para gestionar los datos de este cliente.
        </p>
      )}
    </div>
  )
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="truncate">{children}</dd>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

function channelIcon(channel: EndClient["preferredChannel"]) {
  const className = "size-3.5"
  if (channel === "whatsapp") return <MessageCircle className={className} aria-hidden="true" />
  if (channel === "web") return <Globe className={className} aria-hidden="true" />
  return <Phone className={className} aria-hidden="true" />
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
