import { supabase } from "@/lib/supabase";
import type { Appointment, AppointmentStatus } from "@/lib/mock-data";

// Postgres devuelve un tsrange como string: ["2026-07-22T09:00:00+00:00","2026-07-22T10:00:00+00:00")
function parseTsRange(range: string): { start: Date; end: Date } {
  const [startStr, endStr] = range
    .replace(/^[[(]/, "")
    .replace(/[)\]]$/, "")
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""));
  return { start: new Date(startStr), end: new Date(endStr) };
}

// La UI (heredada del mock) piensa en 4 estados simples. La base real tiene
// 7 — se agrupan así hasta que la Agenda muestre los 7 estados reales.
function mapStatus(dbStatus: string): AppointmentStatus {
  switch (dbStatus) {
    case "confirmed":
      return "confirmado";
    case "held":
    case "awaiting_payment":
    case "pending":
      return "pendiente";
    case "completed":
      return "completado";
    case "cancelled":
    case "no_show":
      return "cancelado";
    default:
      return "pendiente";
  }
}

export type AppointmentWithRawStatus = Appointment & {
  rawStatus: string;
  serviceId: string;
  professionalId: string;
};

type AppointmentRow = {
  id: string;
  time_range: string;
  status: string;
  service_id: string;
  professional_id: string;
  clients: { name: string } | null;
  services: { name: string; base_price: number } | null;
  professionals: { name: string } | null;
};

function friendlyDbError(error: { code?: string; message: string }): Error {
  // 23P01 = exclusion_violation → es la restricción anti doble-booking de
  // la base (professional_id + time_range no pueden pisarse).
  if (error.code === "23P01") {
    return new Error("Ese horario ya no está disponible para esa profesional. Elegí otro.");
  }
  return new Error(error.message);
}

/**
 * Reprograma un turno existente. El cliente nunca cambia al reprogramar
 * (si hay que cambiar de clienta, eso es cancelar y crear un turno nuevo,
 * no una edición) — solo se puede mover el servicio, la profesional y/o
 * el horario.
 */
export async function rescheduleAppointment(params: {
  appointmentId: string;
  professionalId: string;
  serviceId: string;
  startAt: Date;
  durationMinutes: number;
}) {
  const endAt = new Date(params.startAt.getTime() + params.durationMinutes * 60000);
  const timeRange = `["${params.startAt.toISOString()}","${endAt.toISOString()}")`;

  const { error } = await supabase
    .from("appointments")
    .update({
      professional_id: params.professionalId,
      service_id: params.serviceId,
      time_range: timeRange,
    })
    .eq("id", params.appointmentId);

  if (error) throw friendlyDbError(error);
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) throw error;
}

export async function fetchPrimaryLocationId(businessId: string): Promise<string | null> {
  const { data } = await supabase
    .from("locations")
    .select("id")
    .eq("business_id", businessId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Turno creado a mano por el staff (ej: alguien que llamó por teléfono).
 * A diferencia de la reserva pública, este INSERT es directo — no pasa por
 * hold_appointment_slot() porque ese flujo es específicamente para
 * clientes anónimos con retención temporal. Nace directo en 'confirmed'.
 * La restricción anti doble-booking de la base (EXCLUDE constraint) sigue
 * protegiendo igual, insertando por acá o por RPC.
 */
export async function createAppointment(params: {
  businessId: string;
  locationId: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  startAt: Date;
  durationMinutes: number;
}) {
  const endAt = new Date(params.startAt.getTime() + params.durationMinutes * 60000);
  const timeRange = `["${params.startAt.toISOString()}","${endAt.toISOString()}")`;

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("appointments").insert({
    business_id: params.businessId,
    location_id: params.locationId,
    client_id: params.clientId,
    service_id: params.serviceId,
    professional_id: params.professionalId,
    time_range: timeRange,
    status: "confirmed",
    created_by: userData.user?.id ?? null,
  });

  if (error) throw friendlyDbError(error);
}

/**
 * Trae los turnos del negocio. TODO (performance, para más adelante):
 * hoy no filtra por rango de fechas en el servidor porque filtrar sobre un
 * tsrange vía PostgREST requiere una función RPC o una columna calculada
 * de "starts_at" — se filtra en el cliente igual que hacía el mock,
 * acotado con un `limit` razonable mientras el volumen sea bajo.
 */
export async function fetchAppointments(businessId: string): Promise<AppointmentWithRawStatus[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, time_range, status, service_id, professional_id,
       clients ( name ),
       services ( name, base_price ),
       professionals ( name )`,
    )
    .eq("business_id", businessId)
    .order("time_range", { ascending: true })
    .limit(200);

  if (error) throw error;

  return ((data ?? []) as unknown as AppointmentRow[]).map((row) => {
    const { start, end } = parseTsRange(row.time_range);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    return {
      id: row.id,
      clientName: row.clients?.name ?? "Cliente",
      clientId: "", // no se usa en las pantallas actuales, se puede sumar si hace falta
      service: row.services?.name ?? "Servicio",
      serviceId: row.service_id,
      staff: row.professionals?.name?.split(" ")[0] ?? "-",
      professionalId: row.professional_id,
      date: start.toISOString(),
      duration: durationMin,
      price: row.services?.base_price ?? 0,
      status: mapStatus(row.status),
      rawStatus: row.status,
    };
  });
}
