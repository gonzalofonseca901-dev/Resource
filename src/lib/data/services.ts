import { supabase } from "@/lib/supabase";
import type { Service } from "@/lib/mock-data";

export type ServiceWithImage = Service & { imageUrl: string | null };

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  base_price: number;
  active: boolean;
  image_url: string | null;
  service_categories: { name: string } | null;
};

// Nota: usa siempre base_price. Los overrides por sede (service_prices)
// se suman cuando la app tenga selector de sede activo en el backoffice.
export async function fetchServiceCategories(
  businessId: string,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("service_categories")
    .select("id, name")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createService(
  businessId: string,
  values: {
    name: string;
    categoryName: string;
    durationMinutes: number;
    price: number;
    imageUrl: string;
  },
) {
  let categoryId: string | null = null;

  if (values.categoryName.trim()) {
    const { data: existing } = await supabase
      .from("service_categories")
      .select("id")
      .eq("business_id", businessId)
      .ilike("name", values.categoryName.trim())
      .maybeSingle();

    if (existing?.id) {
      categoryId = existing.id;
    } else {
      const { data: created, error: catErr } = await supabase
        .from("service_categories")
        .insert({ business_id: businessId, name: values.categoryName.trim() })
        .select("id")
        .single();
      if (catErr) throw catErr;
      categoryId = created.id;
    }
  }

  const { error } = await supabase.from("services").insert({
    business_id: businessId,
    category_id: categoryId,
    name: values.name,
    duration_minutes: values.durationMinutes,
    base_price: values.price,
    image_url: values.imageUrl || null,
    active: true,
  });
  if (error) throw error;
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  const { error } = await supabase.from("services").update({ active }).eq("id", serviceId);
  if (error) throw error;
}

export async function updateService(
  serviceId: string,
  values: { name: string; durationMinutes: number; price: number; imageUrl: string },
) {
  const { error } = await supabase
    .from("services")
    .update({
      name: values.name,
      duration_minutes: values.durationMinutes,
      base_price: values.price,
      image_url: values.imageUrl || null,
    })
    .eq("id", serviceId);
  if (error) throw error;
}

export async function fetchServices(businessId: string): Promise<ServiceWithImage[]> {
  const { data, error } = await supabase
    .from("services")
    .select(
      `id, name, duration_minutes, base_price, active, image_url,
       service_categories ( name )`,
    )
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as ServiceRow[]).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.service_categories?.name ?? "Sin categoría",
    duration: s.duration_minutes,
    price: s.base_price,
    active: s.active,
    imageUrl: s.image_url,
  }));
}
