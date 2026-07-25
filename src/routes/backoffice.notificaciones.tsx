import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Calendar, CalendarX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { fetchNotifications, type NotificationItem } from "@/lib/data/notifications";
import { useBusinessContext } from "@/lib/business-context";

export const Route = createFileRoute("/backoffice/notificaciones")({
  component: NotificationsPage,
});

const TYPE_META: Record<
  NotificationItem["type"],
  { icon: typeof Bell; title: (n: NotificationItem) => string }
> = {
  confirmation: { icon: Calendar, title: (n) => `Turno confirmado — ${n.clientName}` },
  reminder: { icon: Bell, title: (n) => `Recordatorio enviado — ${n.clientName}` },
  cancellation: { icon: CalendarX, title: (n) => `Turno cancelado — ${n.clientName}` },
};

function NotificationsPage() {
  const { app_business_id: businessId } = useBusinessContext();

  const {
    data: notifications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notifications", businessId],
    queryFn: () => fetchNotifications(businessId!),
    enabled: Boolean(businessId),
  });

  if (isLoading)
    return <div className="p-6 text-sm text-muted-foreground">Cargando notificaciones...</div>;
  if (isError)
    return (
      <div className="p-6 text-sm text-destructive">No se pudieron cargar las notificaciones.</div>
    );

  return (
    <div>
      <PageHeader title="Notificaciones" description="Actividad reciente de la operación." />
      <div className="space-y-2 p-6">
        {(notifications ?? []).map((n) => {
          const meta = TYPE_META[n.type];
          return (
            <Card key={n.id} className={n.isRecent ? "border-primary/40 bg-primary/5" : ""}>
              <CardContent className="flex items-start gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <meta.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{meta.title(n)}</p>
                    <span className="text-xs text-muted-foreground">
                      {n.sentAt ? new Date(n.sentAt).toLocaleString("es-AR") : "-"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {n.serviceName} · estado: {n.status}
                  </p>
                </div>
                {n.isRecent ? <Badge className="ml-2">Nuevo</Badge> : null}
              </CardContent>
            </Card>
          );
        })}
        {(notifications ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Sin actividad reciente todavía.
          </p>
        ) : null}
      </div>
    </div>
  );
}
