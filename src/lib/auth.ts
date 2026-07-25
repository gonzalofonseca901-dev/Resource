import { supabase } from "@/lib/supabase";

// Los claims que agrega custom_access_token_hook (ver 016_auth_claims_hook.sql
// del backend). No vienen en supabase.auth.getUser() — hay que decodificarlos
// del propio access_token.
export type AppClaims = {
  app_role?: "owner" | "manager" | "staff";
  app_business_id?: string;
  app_location_id?: string;
  app_professional_id?: string;
  app_is_platform_admin?: boolean;
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  // atob funciona en browser; en SSR (TanStack Start) usamos Buffer si existe.
  const json =
    typeof atob === "function" ? atob(payload) : Buffer.from(payload, "base64").toString("utf-8");
  return JSON.parse(json);
}

export async function getCurrentClaims(): Promise<AppClaims | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return decodeJwtPayload(token) as AppClaims;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
