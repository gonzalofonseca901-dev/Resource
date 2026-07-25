import { supabase } from "@/lib/supabase";

export type BookableService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  requiresDeposit: boolean;
};

export type BookableProfessional = { id: string; name: string };

export type AvailableSlot = { start: string; end: string };

export async function fetchBookableServices(businessId: string): Promise<BookableService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, base_price, deposit_type")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.duration_minutes,
    price: s.base_price,
    requiresDeposit: Boolean(s.deposit_type && s.deposit_type !== "none"),
  }));
}

export async function fetchProfessionalsForService(
  businessId: string,
  serviceId: string,
): Promise<BookableProfessional[]> {
  const { data, error } = await supabase
    .from("professional_services")
    .select("professionals ( id, name, active, business_id )")
    .eq("service_id", serviceId);
  if (error) throw error;
  return (data ?? [])
    .map(
      (row) =>
        row.professionals as unknown as {
          id: string;
          name: string;
          active: boolean;
          business_id: string;
        },
    )
    .filter((p) => p && p.active && p.business_id === businessId)
    .map((p) => ({ id: p.id, name: p.name }));
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

export async function fetchAvailableSlots(params: {
  businessId: string;
  locationId: string;
  serviceId: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
}): Promise<AvailableSlot[]> {
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_business_id: params.businessId,
    p_location_id: params.locationId,
    p_service_id: params.serviceId,
    p_professional_id: params.professionalId,
    p_date: params.date,
  });
  if (error) throw error;
  return ((data ?? []) as { slot_start: string; slot_end: string }[]).map((s) => ({
    start: s.slot_start,
    end: s.slot_end,
  }));
}

/**
 * El flujo público completo: encuentra o crea la clienta (sin exponer la
 * tabla `clients` directo a `anon`), retiene el horario (`held`, con el
 * límite anti-abuso ya resuelto en la base), y confirma directo.
 *
 * Simplificación a propósito: si el servicio exige seña
 * (`requiresDeposit`), este flujo todavía la ignora y confirma igual —
 * la seña real con Mercado Pago vive en las Edge Functions que quedaron
 * pendientes (ver README de los SQL). Cuando se conecten, este es el
 * punto exacto donde el turno pasaría a `awaiting_payment` en vez de
 * confirmarse directo.
 */
export async function bookAppointment(params: {
  businessId: string;
  locationId: string;
  serviceId: string;
  professionalId: string;
  startAt: Date;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}): Promise<{ appointmentId: string }> {
  const { data: clientId, error: clientErr } = await supabase.rpc("find_or_create_client", {
    p_business_id: params.businessId,
    p_name: params.clientName,
    p_phone: params.clientPhone,
    p_email: params.clientEmail || null,
  });
  if (clientErr) throw clientErr;

  const { data: held, error: holdErr } = await supabase.rpc("hold_appointment_slot", {
    p_business_id: params.businessId,
    p_location_id: params.locationId,
    p_professional_id: params.professionalId,
    p_service_id: params.serviceId,
    p_client_id: clientId,
    p_start_at: params.startAt.toISOString(),
    p_client_ip: null,
  });
  if (holdErr) throw new Error(holdErr.message);

  const appointmentId = (held as { id: string }).id;

  const { error: confirmErr } = await supabase.rpc("confirm_appointment", {
    p_appointment_id: appointmentId,
  });
  if (confirmErr) throw confirmErr;

  return { appointmentId };
}
