import { supabase } from "@/lib/supabase";

export type PlanRow = {
  id: string;
  name: string;
  price: number | null;
  sortOrder: number;
  features: Record<string, boolean | number | null>;
};

export type PlanOverview = {
  currentPlanName: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  businessName: string;
  plans: PlanRow[];
};

type BusinessRow = {
  name: string;
  subscription_status: string;
  current_period_end: string | null;
  plans: { name: string } | null;
};

type PlanTableRow = {
  id: string;
  name: string;
  price: number | null;
  sort_order: number;
  features: Record<string, boolean | number | null>;
};

export async function fetchPlanOverview(businessId: string): Promise<PlanOverview> {
  const { data: business, error: bErr } = await supabase
    .from("businesses")
    .select("name, subscription_status, current_period_end, plans ( name )")
    .eq("id", businessId)
    .single();

  if (bErr) throw bErr;

  const { data: plans, error: pErr } = await supabase
    .from("plans")
    .select("id, name, price, sort_order, features")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (pErr) throw pErr;

  const b = business as unknown as BusinessRow;

  return {
    currentPlanName: b.plans?.name ?? "basico",
    subscriptionStatus: b.subscription_status,
    currentPeriodEnd: b.current_period_end,
    businessName: b.name,
    plans: (plans as unknown as PlanTableRow[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      sortOrder: p.sort_order,
      features: p.features,
    })),
  };
}

/**
 * Cambia el plan del negocio. Ojo: esto solo actualiza qué features ve
 * habilitadas — NO cobra ni gestiona el medio de pago (eso es un flujo
 * de facturación aparte, todavía no construido). Por ahora es un cambio
 * administrativo directo, pensado para que ustedes mismos (no el cliente
 * final) lo usen mientras no haya self-service de facturación.
 */
export async function changePlan(businessId: string, planId: string) {
  const { error } = await supabase
    .from("businesses")
    .update({ plan_id: planId })
    .eq("id", businessId);
  if (error) throw error;
}
