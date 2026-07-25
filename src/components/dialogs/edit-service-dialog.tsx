import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateService, type ServiceWithImage } from "@/lib/data/services";

export function EditServiceDialog({
  service,
  businessId,
  open,
  onOpenChange,
}: {
  service: ServiceWithImage | null;
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({ name: "", durationMinutes: "30", price: "", imageUrl: "" });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        durationMinutes: String(service.duration),
        price: String(service.price),
        imageUrl: service.imageUrl ?? "",
      });
    }
  }, [service]);

  const mutation = useMutation({
    mutationFn: () =>
      updateService(service!.id, {
        name: form.name,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        imageUrl: form.imageUrl,
      }),
    onSuccess: () => {
      toast.success("Servicio actualizado");
      queryClient.invalidateQueries({ queryKey: ["services", businessId] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo actualizar el servicio"),
  });

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar servicio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input
                type="number"
                min={5}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Imagen (URL, opcional)</Label>
            <Input
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
