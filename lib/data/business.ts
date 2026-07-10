// Business + settings fetchers. Today they read the mocked business; later they
// become a single Supabase row fetch (`businesses` + `business_settings`),
// keeping the same async signatures.

import type { Business, ModuleDefinition } from "@/lib/types"
import { MOCK_BUSINESS, MODULE_CATALOG } from "@/lib/mock-data"

/** The current business (single-tenant per session for now). */
export async function getBusiness(): Promise<Business> {
  return MOCK_BUSINESS
}

/** Static catalog describing every product module the platform offers. */
export async function getModuleCatalog(): Promise<ModuleDefinition[]> {
  return MODULE_CATALOG
}
