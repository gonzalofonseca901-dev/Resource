import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandStyle } from "@/components/shared/BrandStyle";
import { TenantProvider } from "@/lib/tenant-context";
import { getTenantBySlug, PLAN_LABELS, type TenantRecord } from "@/lib/tenants";
import { fetchRealSiteConfig } from "@/lib/data/site-config";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCurrentClaims, signOut, type AppClaims } from "@/lib/auth";
import { BusinessProvider } from "@/lib/business-context";

export const Route = createFileRoute("/backoffice")({
  component: BackofficeLayout,
});

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño/a",
  manager: "Manager",
  staff: "Staff",
};

function BackofficeLayout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "no-session" | "error">("loading");
  const [claims, setClaims] = useState<AppClaims | null>(null);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolve() {
      const currentClaims = await getCurrentClaims();

      if (!currentClaims?.app_business_id) {
        if (active) setStatus("no-session");
        return;
      }

      // Puente temporal: el negocio real ya existe en la tabla `businesses`
      // (con su `slug`), pero el contenido completo de la landing/marca
      // (siteConfig completo: hero, servicios, equipo, etc.) todavía vive
      // en el mock de src/lib/tenants.ts. Hasta que se construya el mapeo
      // real businesses+business_settings -> SiteConfig, resolvemos el
      // negocio real por id y usamos ese slug para buscar el contenido
      // visual en el mock. El GATE de acceso (quién puede entrar) ya es
      // 100% real desde este punto — solo el contenido de marca es puente.
      const { data, error } = await supabase
        .from("businesses")
        .select("slug")
        .eq("id", currentClaims.app_business_id)
        .single();

      if (error || !data?.slug) {
        if (active) {
          setErrorMsg(
            "Tu usuario está autenticado pero no encontramos el negocio asociado en la base. Revisá staff_accounts.",
          );
          setStatus("error");
        }
        return;
      }

      const resolvedMockTenant = getTenantBySlug(data.slug);
      if (!resolvedMockTenant) {
        if (active) {
          setErrorMsg(
            `El negocio "${data.slug}" existe en Supabase pero todavía no tiene contenido de marca en src/lib/tenants.ts.`,
          );
          setStatus("error");
        }
        return;
      }

      const realSite = await fetchRealSiteConfig(data.slug, resolvedMockTenant.site);
      const resolvedTenant: TenantRecord = { ...resolvedMockTenant, site: realSite };

      if (active) {
        setClaims(currentClaims);
        setTenant(resolvedTenant);
        setStatus("ready");
      }
    }

    resolve();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setStatus("no-session");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "no-session") {
      navigate({ to: "/login" });
    }
  }, [status, navigate]);

  if (status === "loading" || status === "no-session") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando sesión...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-destructive">No se pudo cargar el panel</p>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  if (!tenant || !claims) return null;

  return (
    <BusinessProvider claims={claims}>
      <TenantProvider tenant={tenant}>
        <BrandStyle />
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-muted/20">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <span className="text-sm text-muted-foreground">
                    {tenant.site.business.name} · Plan {PLAN_LABELS[tenant.plan]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[claims.app_role ?? ""] ?? claims.app_role}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/login" });
                    }}
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </header>
              <main className="min-w-0 flex-1">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TenantProvider>
    </BusinessProvider>
  );
}
