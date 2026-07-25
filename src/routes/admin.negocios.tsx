import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTenants, PLAN_LABELS } from "@/lib/tenants";

export const Route = createFileRoute("/admin/negocios")({
  component: NegociosPage,
});

function NegociosPage() {
  const tenants = listTenants();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Negocios</h1>
        <p className="text-sm text-muted-foreground">
          Cada fila es un tenant — hoy vienen de src/lib/tenants.ts (mock), después de la tabla
          `businesses` en Supabase.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tenants.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.site.business.name}</CardTitle>
                <Badge variant="secondary">{PLAN_LABELS[t.plan]}</Badge>
              </div>
              <CardDescription>
                {t.site.business.city}, {t.site.business.region}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Slug</span>
                <span className="font-mono text-xs">{t.slug}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Dominio propio</span>
                <span>{t.customDomain ?? "— (subdominio)"}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Alta</span>
                <span>{new Date(t.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
              <Link
                to="/sitio/$slug"
                params={{ slug: t.slug }}
                target="_blank"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver sitio público <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
