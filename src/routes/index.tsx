import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { listTenants } from "@/lib/tenants";

export const Route = createFileRoute("/")({
  component: PlatformHome,
});

function PlatformHome() {
  const tenants = listTenants();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Demo interna
      </p>
      <h1 className="mt-2 text-3xl font-bold">Plataforma — mock data</h1>
      <p className="mt-3 text-muted-foreground">
        Todavía no hay resolución por subdominio/dominio propio (eso llega con Supabase). Por ahora,
        esta pantalla es el punto de entrada para navegar las tres áreas a mano.
      </p>

      <div className="mt-10 space-y-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-semibold">Sitios públicos por negocio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            En producción sería{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">negocio.tuplataforma.com</code>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tenants.map((t) => (
              <Link
                key={t.slug}
                to="/sitio/$slug"
                params={{ slug: t.slug }}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                {t.site.business.name} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>

        <Link
          to="/backoffice"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
        >
          <div>
            <p className="text-sm font-semibold">Backoffice</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Panel de un negocio — agenda, clientes, plan, etc.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>

        <Link
          to="/admin"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
        >
          <div>
            <p className="text-sm font-semibold">Admin de plataforma</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu panel — todos los negocios, planes, auditoría.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
