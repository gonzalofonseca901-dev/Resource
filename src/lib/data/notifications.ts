import { supabase } from "@/lib/supabase";

export type NotificationItem = {
  id: string;
  type: "reminder" | "confirmation" | "cancellation";
  status: string;
  sentAt: string | null;
  clientName: string;
  serviceName: string;
  isRecent: boolean;
};

type NotificationRow = {
  id: string;
  type: string;
  status: string;
  sent_at: string | null;
  clients: { name: string } | null;
  appointments: { services: { name: string } | null } | null;
};

/**
 * Simplificación a propósito: el modelo real (`notifications_log`) solo
 * cubre 3 tipos (reminder/confirmation/cancellation) — no existe todavía
 * un log de "cliente nuevo" o "pago recibido" como tenía el mock (esos
 * eventos viven en `clients.created_at` y `payments`, son otra fuente de
 * datos). Se deja así por ahora; combinarlos en un solo feed de actividad
 * es un paso aparte, no una corrección de bug.
 * `isRecent` (últimas 24h) reemplaza al concepto de "no leído" del mock,
 * que no existe en el modelo real.
 */
export async function fetchNotifications(businessId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications_log")
    .select(
      `id, type, status, sent_at,
       clients ( name ),
       appointments ( services ( name ) )`,
    )
    .eq("business_id", businessId)
    .order("sent_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  const now = Date.now();

  return ((data ?? []) as unknown as NotificationRow[]).map((n) => ({
    id: n.id,
    type: n.type as NotificationItem["type"],
    status: n.status,
    sentAt: n.sent_at,
    clientName: n.clients?.name ?? "Cliente",
    serviceName: n.appointments?.services?.name ?? "Turno",
    isRecent: n.sent_at ? now - new Date(n.sent_at).getTime() < 24 * 60 * 60 * 1000 : false,
  }));
}
