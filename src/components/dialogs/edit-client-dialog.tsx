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
import { updateClient } from "@/lib/data/clients";
import type { Client } from "@/lib/mock-data";

export function EditClientDialog({
  client,
  businessId,
  open,
  onOpenChange,
}: {
  client: Client | null;
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        phone: client.phone === "-" ? "" : client.phone,
        email: client.email === "-" ? "" : client.email,
      });
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: () => updateClient(client!.id, form),
    onSuccess: () => {
      toast.success("Cliente actualizado");
      queryClient.invalidateQueries({ queryKey: ["clients", businessId] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo actualizar el cliente"),
  });

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
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
