import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createAppointment, fetchPrimaryLocationId } from "@/lib/data/appointments";
import { fetchClients } from "@/lib/data/clients";
import { fetchServices } from "@/lib/data/services";
import { fetchStaff } from "@/lib/data/staff";

export function NewAppointmentDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: () => fetchClients(businessId),
    enabled: open,
  });
  const { data: services } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => fetchServices(businessId),
    enabled: open,
  });
  const { data: staff } = useQuery({
    queryKey: ["staff", businessId],
    queryFn: () => fetchStaff(businessId),
    enabled: open,
  });

  const selectedService = (services ?? []).find((s) => s.id === serviceId);

  const mutation = useMutation({
    mutationFn: async () => {
      const locationId = await fetchPrimaryLocationId(businessId);
      if (!locationId) throw new Error("El negocio todavía no tiene una sede activa cargada.");
      if (!selectedService) throw new Error("Elegí un servicio.");

      const startAt = new Date(`${date}T${time}:00`);
      await createAppointment({
        businessId,
        locationId,
        clientId,
        serviceId,
        professionalId,
        startAt,
        durationMinutes: selectedService.duration,
      });
    },
    onSuccess: () => {
      toast.success("Turno creado");
      queryClient.invalidateQueries({ queryKey: ["appointments", businessId] });
      setClientId("");
      setServiceId("");
      setProfessionalId("");
      setDate("");
      setTime("");
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "No se pudo crear el turno";
      // El mensaje más común acá va a ser el de la restricción anti
      // doble-booking de la base ("ese horario ya no está disponible") si
      // dos personas intentan agendar lo mismo casi al mismo tiempo.
      toast.error(msg);
    },
  });

  const valid = clientId && serviceId && professionalId && date && time;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nuevo turno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            Para reservas tomadas por teléfono o en el mostrador. Nace confirmado directo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un cliente" />
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Servicio</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un servicio" />
              </SelectTrigger>
              <SelectContent>
                {(services ?? [])
                  .filter((s) => s.active)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration} min)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Profesional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí una profesional" />
              </SelectTrigger>
              <SelectContent>
                {(staff ?? [])
                  .filter((s) => s.active)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            Crear turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
