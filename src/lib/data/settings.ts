import { supabase } from "@/lib/supabase";

export type SettingsOverview = {
  businessName: string;
  locationId: string | null;
  address: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  hours: { dayOfWeek: number; open: boolean; startTime: string; endTime: string }[];
};

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export { DAY_LABELS };

type LocationHourRow = { day_of_week: number; start_time: string; end_time: string };

export async function fetchSettingsOverview(businessId: string): Promise<SettingsOverview> {
  const { data: business, error: bErr } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();
  if (bErr) throw bErr;

  const { data: settingsRow } = await supabase
    .from("business_settings")
    .select("settings")
    .eq("business_id", businessId)
    .single();

  const { data: location } = await supabase
    .from("locations")
    .select("id, address, phone")
    .eq("business_id", businessId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  let hoursRows: LocationHourRow[] = [];
  if (location?.id) {
    const { data } = await supabase
      .from("location_hours")
      .select("day_of_week, start_time, end_time")
      .eq("location_id", location.id);
    hoursRows = (data ?? []) as LocationHourRow[];
  }

  const branding = (settingsRow?.settings as Record<string, unknown> | undefined)?.branding as
    { primaryColor?: string; secondaryColor?: string } | undefined;

  const hours = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = hoursRows.find((h) => h.day_of_week === dayOfWeek);
    return {
      dayOfWeek,
      open: Boolean(row),
      startTime: row?.start_time ?? "09:00",
      endTime: row?.end_time ?? "20:00",
    };
  });

  return {
    businessName: business.name,
    locationId: location?.id ?? null,
    address: location?.address ?? "",
    phone: location?.phone ?? "",
    primaryColor: branding?.primaryColor ?? "#E8637E",
    secondaryColor: branding?.secondaryColor ?? "#C94F68",
    hours,
  };
}

export async function updateBusinessInfo(
  businessId: string,
  locationId: string | null,
  values: { name: string; address: string; phone: string },
) {
  const { error: e1 } = await supabase
    .from("businesses")
    .update({ name: values.name })
    .eq("id", businessId);
  if (e1) throw e1;

  if (locationId) {
    const { error: e2 } = await supabase
      .from("locations")
      .update({ address: values.address, phone: values.phone })
      .eq("id", locationId);
    if (e2) throw e2;
  }
}

export async function updateBrandColors(
  businessId: string,
  values: { primaryColor: string; secondaryColor: string },
) {
  const { data: current } = await supabase
    .from("business_settings")
    .select("settings")
    .eq("business_id", businessId)
    .single();

  const settings = (current?.settings as Record<string, unknown>) ?? {};
  const branding = (settings.branding as Record<string, unknown>) ?? {};
  settings.branding = { ...branding, ...values };

  const { error } = await supabase
    .from("business_settings")
    .update({ settings, updated_at: new Date().toISOString() })
    .eq("business_id", businessId);
  if (error) throw error;
}

export async function toggleDayOpen(
  locationId: string,
  dayOfWeek: number,
  open: boolean,
  startTime: string,
  endTime: string,
) {
  if (open) {
    const { error } = await supabase.from("location_hours").insert({
      location_id: locationId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("location_hours")
      .delete()
      .eq("location_id", locationId)
      .eq("day_of_week", dayOfWeek);
    if (error) throw error;
  }
}
