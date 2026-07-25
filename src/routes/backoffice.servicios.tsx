import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, DollarSign, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { currency } from "@/lib/mock-data";
import { fetchServices, toggleServiceActive, type ServiceWithImage } from "@/lib/data/services";
import { useBusinessContext } from "@/lib/business-context";
import { NewServiceDialog } from "@/components/dialogs/new-service-dialog";
import { EditServiceDialog } from "@/components/dialogs/edit-service-dialog";

export const Route = createFileRoute("/backoffice/servicios")({
  component: ServicesPage,
});

function ServicesPage() {
  const { app_business_id: businessId } = useBusinessContext();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ServiceWithImage | null>(null);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleServiceActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", businessId] });
    },
    onError: () => toast.error("No se pudo actualizar el estado del servicio"),
  });

  const {
    data: services,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => fetchServices(businessId!),
    enabled: Boolean(businessId),
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando servicios...</div>;
  }
  if (isError) {
    return <div className="p-6 text-sm text-destructive">No se pudieron cargar los servicios.</div>;
  }

  const filtered = (services ?? []).filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  const categories = Array.from(new Set(filtered.map((s) => s.category)));

  return (
    <div>
      <PageHeader
        title="Servicios"
        description="Catálogo de tratamientos, duración y precios."
        actions={<NewServiceDialog businessId={businessId!} />}
      />
      <div className="space-y-6 p-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar servicio..."
            className="pl-9"
          />
        </div>
        {categories.map((cat) => (
          <div key={cat}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {cat}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered
                .filter((s) => s.category === cat)
                .map((s) => (
                  <Card key={s.id} className={s.active ? "" : "opacity-60"}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle
                          className="text-base cursor-pointer hover:underline"
                          onClick={() => setEditing(s)}
                        >
                          {s.name}
                        </CardTitle>
                        <Switch
                          checked={s.active}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: s.id, active: checked })
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {s.duration} min
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          {currency(s.price)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {s.active ? "Activo" : "Pausado"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
        {(services ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay servicios cargados.</p>
        ) : null}
      </div>
      <EditServiceDialog
        service={editing}
        businessId={businessId!}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
