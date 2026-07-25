import { supabase } from "@/lib/supabase";
import type { Client } from "@/lib/mock-data";

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

type CompletedApptRow = {
  client_id: string;
  time_range: string;
};

type PaymentRow = {
  client_id: string;
  amount: number;
  status: string;
};

/**
 * Simplificaciones a propósito, documentadas para no confundirlas con
 * bugs más adelante:
 *  - `tags` siempre vuelve vacío: el modelo real no tiene un concepto de
 *    "etiqueta libre" para clientes todavía (podría derivarse de
 *    loyalty_points o de client_packages activos si se quiere más adelante).
 *  - `totalVisits`/`lastVisit`/`totalSpent` se calculan acá con 2 queries
 *    extra en vez de traerlos ya calculados — para un volumen chico (un
 *    solo negocio) es aceptable; si esto se vuelve lento, es candidato a
 *    una vista materializada o un RPC, como ya hicimos con analytics.
 */
export async function createClient(
  businessId: string,
  values: { name: string; phone: string; email: string },
) {
  const { error } = await supabase.from("clients").insert({
    business_id: businessId,
    name: values.name,
    phone: values.phone || null,
    email: values.email || null,
  });
  if (error) throw error;
}

export async function updateClient(
  clientId: string,
  values: { name: string; phone: string; email: string },
) {
  const { error } = await supabase
    .from("clients")
    .update({ name: values.name, phone: values.phone || null, email: values.email || null })
    .eq("id", clientId);
  if (error) throw error;
}

export async function fetchClients(businessId: string): Promise<Client[]> {
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, phone, email, created_at")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;

  const { data: completedAppts } = await supabase
    .from("appointments")
    .select("client_id, time_range")
    .eq("business_id", businessId)
    .eq("status", "completed");

  const { data: payments } = await supabase
    .from("payments")
    .select("client_id, amount, status")
    .eq("business_id", businessId)
    .eq("status", "approved");

  const visitsByClient = new Map<string, { count: number; last: string }>();
  for (const row of (completedAppts ?? []) as CompletedApptRow[]) {
    const rangeStart = row.time_range.replace(/^[[(]/, "").split(",")[0].replace(/^"|"$/g, "");
    const entry = visitsByClient.get(row.client_id) ?? { count: 0, last: rangeStart };
    entry.count += 1;
    if (new Date(rangeStart) > new Date(entry.last)) entry.last = rangeStart;
    visitsByClient.set(row.client_id, entry);
  }

  const spentByClient = new Map<string, number>();
  for (const row of (payments ?? []) as PaymentRow[]) {
    spentByClient.set(row.client_id, (spentByClient.get(row.client_id) ?? 0) + row.amount);
  }

  return ((clients ?? []) as ClientRow[]).map((c) => {
    const visits = visitsByClient.get(c.id);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone ?? "-",
      email: c.email ?? "-",
      totalVisits: visits?.count ?? 0,
      lastVisit: visits?.last ?? c.created_at,
      totalSpent: spentByClient.get(c.id) ?? 0,
      tags: [],
    };
  });
}
