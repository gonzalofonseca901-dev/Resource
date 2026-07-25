import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { updateAppointmentStatus, type AppointmentWithRawStatus } from "@/lib/data/appointments";
import { currency } from "@/lib/mock-data";

const RAW_LABELS: Record<string, string> = {
  held: "Retenido (checkout en curso)",
  awaiting_payment: "Esperando pago de seña",
  pending: "Pendiente de aprobación",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "Ausente (no-show)",
};

export function AppointmentDetailDialog({
  appointment,
  businessId,
  open,
  onOpenChange,
  onReschedule,
}: {
  appointment: AppointmentWithRawStatus | null;
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReschedule: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: string) => updateAppointmentStatus(appointment!.id, status),
    onSuccess: () => {
      toast.success("Turno actualizado");
      queryClient.invalidateQueries({ queryKey: ["appointments", businessId] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo actualizar el turno"),
  });

  if (!appointment) return null;

  const raw = appointment.rawStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{appointment.clientName}</DialogTitle>
          <DialogDescription>
            {appointment.service} · {appointment.staff}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha y hora</span>
            <span>
              {new Date(appointment.date).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duración</span>
            <span>{appointment.duration} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precio</span>
            <span>{currency(appointment.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <Badge variant="outline">{RAW_LABELS[raw] ?? raw}</Badge>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          {(raw === "pending" ||
            raw === "held" ||
            raw === "awaiting_payment" ||
            raw === "confirmed") && (
            <Button
              size="sm"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={onReschedule}
            >
              Reprogramar
            </Button>
          )}
          {(raw === "pending" || raw === "held" || raw === "awaiting_payment") && (
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("confirmed")}
            >
              Confirmar
            </Button>
          )}
          {raw === "confirmed" && (
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("completed")}
            >
              Marcar completado
            </Button>
          )}
          {raw === "confirmed" && (
            <Button
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("no_show")}
            >
              Marcar ausente
            </Button>
          )}
          {(raw === "confirmed" || raw === "pending") && (
            <Button
              size="sm"
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("cancelled")}
            >
              Cancelar turno
            </Button>
          )}
          {(raw === "completed" || raw === "cancelled" || raw === "no_show") && (
            <p className="text-xs text-muted-foreground">
              Este turno ya está cerrado, no admite más cambios de estado.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
