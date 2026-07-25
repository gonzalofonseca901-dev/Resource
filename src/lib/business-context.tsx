import { createContext, useContext, type ReactNode } from "react";
import type { AppClaims } from "@/lib/auth";

const BusinessContext = createContext<AppClaims | null>(null);

export function BusinessProvider({ claims, children }: { claims: AppClaims; children: ReactNode }) {
  return <BusinessContext.Provider value={claims}>{children}</BusinessContext.Provider>;
}

/**
 * El negocio/rol resuelto en el login (ver backoffice.tsx). Cualquier
 * pantalla que necesite saber "de qué negocio traigo datos" usa esto en
 * vez de leer el JWT de nuevo.
 */
export function useBusinessContext(): AppClaims {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusinessContext() usado fuera de <BusinessProvider>.");
  }
  return ctx;
}
