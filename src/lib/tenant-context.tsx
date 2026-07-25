import { createContext, useContext, type ReactNode } from "react";
import type { TenantRecord } from "@/lib/tenants";
import type { SiteConfig } from "@/config/siteConfig";

const TenantContext = createContext<TenantRecord | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantRecord;
  children: ReactNode;
}) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

/**
 * The resolved business for whatever is being rendered right now — a public
 * landing page (resolved by slug), or a backoffice/admin screen (resolved by
 * the logged-in session, mocked for now via TenantSwitcher).
 *
 * Every component that needs "this business' data" calls this instead of
 * importing a concrete object — that's what makes the same component tree
 * work for any client.
 */
export function useTenant(): TenantRecord {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error("useTenant() called outside a <TenantProvider>. Wrap the route in one.");
  }
  return tenant;
}

export function useSiteConfig(): SiteConfig {
  return useTenant().site;
}
