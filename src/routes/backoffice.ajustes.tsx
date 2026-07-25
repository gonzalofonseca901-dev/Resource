import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useBusinessContext } from "@/lib/business-context";
import {
  fetchSettingsOverview,
  updateBusinessInfo,
  updateBrandColors,
  toggleDayOpen,
  DAY_LABELS,
} from "@/lib/data/settings";

export const Route = createFileRoute("/backoffice/ajustes")({
  component: SettingsPage,
});

function SettingsPage() {
  const { app_business_id: businessId } = useBusinessContext();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["settings-overview", businessId],
    queryFn: () => fetchSettingsOverview(businessId!),
    enabled: Boolean(businessId),
  });

  const [businessForm, setBusinessForm] = useState({ name: "", address: "", phone: "" });
  const [brandForm, setBrandForm] = useState({ primaryColor: "", secondaryColor: "" });

  useEffect(() => {
    if (!data) return;
    setBusinessForm({ name: data.businessName, address: data.address, phone: data.phone });
    setBrandForm({ primaryColor: data.primaryColor, secondaryColor: data.secondaryColor });
  }, [data]);

  const saveBusinessInfo = useMutation({
    mutationFn: () => updateBusinessInfo(businessId!, data?.locationId ?? null, businessForm),
    onSuccess: () => {
      toast.success("Datos del centro guardados");
      queryClient.invalidateQueries({ queryKey: ["settings-overview", businessId] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const saveBrand = useMutation({
    mutationFn: () => updateBrandColors(businessId!, brandForm),
    onSuccess: () => {
      toast.success("Marca actualizada");
      queryClient.invalidateQueries({ queryKey: ["settings-overview", businessId] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const toggleDay = useMutation({
    mutationFn: (args: { dayOfWeek: number; open: boolean; startTime: string; endTime: string }) =>
      toggleDayOpen(data!.locationId!, args.dayOfWeek, args.open, args.startTime, args.endTime),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings-overview", businessId] }),
    onError: () => toast.error("No se pudo actualizar el horario"),
  });

  if (isLoading)
    return <div className="p-6 text-sm text-muted-foreground">Cargando ajustes...</div>;
  if (isError || !data)
    return <div className="p-6 text-sm text-destructive">No se pudieron cargar los ajustes.</div>;

  return (
    <div>
      <PageHeader
        title="Ajustes"
        description="Configuración del centro y preferencias generales."
      />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del centro</CardTitle>
            <CardDescription>Información visible para tus clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del centro</Label>
              <Input
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={saveBusinessInfo.isPending}
              onClick={() => saveBusinessInfo.mutate()}
            >
              Guardar cambios
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marca</CardTitle>
            <CardDescription>Colores que se usan en tu landing pública.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Color primario</Label>
                <div className="flex items-center gap-2">
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border"
                    style={{ backgroundColor: brandForm.primaryColor }}
                  />
                  <Input
                    value={brandForm.primaryColor}
                    onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color secundario</Label>
                <div className="flex items-center gap-2">
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border"
                    style={{ backgroundColor: brandForm.secondaryColor }}
                  />
                  <Input
                    value={brandForm.secondaryColor}
                    onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <Button size="sm" disabled={saveBrand.isPending} onClick={() => saveBrand.mutate()}>
              Guardar cambios
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recordatorios</CardTitle>
            <CardDescription>
              Cómo notificamos a tus clientes (vista de referencia — la configuración fina todavía
              no está conectada).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email 24 h antes</p>
                <p className="text-xs text-muted-foreground">
                  Envío automático por email el día previo al turno
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email de confirmación</p>
                <p className="text-xs text-muted-foreground">Se envía al reservar</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horario de atención</CardTitle>
            <CardDescription>
              {data.locationId
                ? "Define cuándo se pueden reservar turnos."
                : "Todavía no hay una sede activa para configurar horarios."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.hours.map((h) => (
              <div key={h.dayOfWeek} className="flex items-center justify-between">
                <span className="text-sm">{DAY_LABELS[h.dayOfWeek]}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {h.open ? (
                    <span>
                      {h.startTime.slice(0, 5)} – {h.endTime.slice(0, 5)}
                    </span>
                  ) : (
                    <span className="italic">Cerrado</span>
                  )}
                  <Switch
                    checked={h.open}
                    disabled={!data.locationId || toggleDay.isPending}
                    onCheckedChange={(checked) =>
                      toggleDay.mutate({
                        dayOfWeek: h.dayOfWeek,
                        open: checked,
                        startTime: h.startTime,
                        endTime: h.endTime,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zona peligrosa</CardTitle>
            <CardDescription>Acciones irreversibles — todavía no conectadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" disabled>
              Exportar datos
            </Button>
            <Button variant="destructive" size="sm" disabled>
              Eliminar centro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
