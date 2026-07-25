import { supabase } from "@/lib/supabase";
import type { StaffMember } from "@/lib/mock-data";

type ProfessionalRow = {
  id: string;
  name: string;
  bio: string | null;
  active: boolean;
  professional_services: { service_id: string; services: { name: string } | null }[] | null;
};

export type StaffMemberWithServiceIds = StaffMember & { serviceIds: string[] };

/**
 * Nota: `professionals` es un perfil público (se muestra en la landing),
 * por diseño no guarda email — el email/login de esa persona vive en
 * `staff_accounts` -> `auth.users`, que tiene su propio nivel de acceso
 * (RLS más restrictivo). Por eso el email queda vacío acá; si el
 * backoffice necesita mostrarlo, hay que traerlo con una query separada
 * a `staff_accounts` (solo visible para owner/manager).
 */
export async function createProfessional(
  businessId: string,
  values: { name: string; bio: string; serviceIds: string[] },
) {
  const { data: created, error } = await supabase
    .from("professionals")
    .insert({ business_id: businessId, name: values.name, bio: values.bio || null, active: true })
    .select("id")
    .single();
  if (error) throw error;

  if (values.serviceIds.length > 0) {
    const rows = values.serviceIds.map((serviceId) => ({
      professional_id: created.id,
      service_id: serviceId,
    }));
    const { error: linkErr } = await supabase.from("professional_services").insert(rows);
    if (linkErr) throw linkErr;
  }
}

export async function toggleProfessionalActive(professionalId: string, active: boolean) {
  const { error } = await supabase
    .from("professionals")
    .update({ active })
    .eq("id", professionalId);
  if (error) throw error;
}

export async function updateProfessional(
  professionalId: string,
  values: { name: string; bio: string; serviceIds: string[] },
) {
  const { error } = await supabase
    .from("professionals")
    .update({ name: values.name, bio: values.bio || null })
    .eq("id", professionalId);
  if (error) throw error;

  const { error: delErr } = await supabase
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId);
  if (delErr) throw delErr;

  if (values.serviceIds.length > 0) {
    const rows = values.serviceIds.map((serviceId) => ({
      professional_id: professionalId,
      service_id: serviceId,
    }));
    const { error: insErr } = await supabase.from("professional_services").insert(rows);
    if (insErr) throw insErr;
  }
}

export async function fetchStaff(businessId: string): Promise<StaffMemberWithServiceIds[]> {
  const { data, error } = await supabase
    .from("professionals")
    .select(
      `id, name, bio, active,
       professional_services ( service_id, services ( name ) )`,
    )
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as ProfessionalRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.bio ?? "Profesional",
    email: "",
    services: (p.professional_services ?? [])
      .map((ps) => ps.services?.name)
      .filter((n): n is string => Boolean(n)),
    serviceIds: (p.professional_services ?? []).map((ps) => ps.service_id),
    active: p.active,
  }));
}
