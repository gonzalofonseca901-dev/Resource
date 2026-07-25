import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { rescheduleAppointment, type AppointmentWithRawStatus } from "@/lib/data/appointments";
import { fetchServices } from "@/lib/data/services";
import { fetchStaff } from "@/lib/data/staff";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toTimeInputValue(d: Date) {
  return d.toISOString().slice(11, 16);
}

export function RescheduleAppointmentDialog({
  appointment,
  businessId,
  open,
  onOpenChange,
}: {
  appointment: AppointmentWithRawStatus | null;
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (appointment) {
      const start = new Date(appointment.date);
      setDate(toDateInputValue(start));
      setTime(toTimeInputValue(start));
      setServiceId(appointment.serviceId);
      setProfessionalId(appointment.professionalId);
    }
  }, [appointment]);

  const selectedService = (services ?? []).find((s) => s.id === serviceId);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedService) throw new Error("Elegí un servicio.");
      const startAt = new Date(`${date}T${time}:00`);
      return rescheduleAppointment({
        appointmentId: appointment!.id,
        professionalId,
        serviceId,
        startAt,
        durationMinutes: selectedService.duration,
      });
    },
    onSuccess: () => {
      toast.success("Turno reprogramado");
      queryClient.invalidateQueries({ queryKey: ["appointments", businessId] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo reprogramar el turno");
    },
  });

  if (!appointment) return null;

  const valid = serviceId && professionalId && date && time;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogramar turno</DialogTitle>
          <DialogDescription>
            {appointment.clientName} — el cliente no cambia, solo día/hora/profesional.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            Guardar nuevo horario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
