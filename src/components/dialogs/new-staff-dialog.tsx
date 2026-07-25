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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { createProfessional } from "@/lib/data/staff";
import { fetchServices } from "@/lib/data/services";

export function NewStaffDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "" });
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => fetchServices(businessId),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => createProfessional(businessId, { ...form, serviceIds }),
    onSuccess: () => {
      toast.success("Profesional agregada");
      queryClient.invalidateQueries({ queryKey: ["staff", businessId] });
      setForm({ name: "", bio: "" });
      setServiceIds([]);
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "No se pudo agregar la profesional";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Sumar integrante
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sumar integrante</DialogTitle>
          <DialogDescription>
            Si tu plan tiene un límite de profesionales, la base lo va a rechazar automáticamente al
            llegar al tope.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Rol / especialidad (texto libre)</Label>
            <Textarea
              placeholder="Ej: Especialista en depilación láser"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Servicios que puede realizar</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
              {(services ?? []).map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`svc-${s.id}`}
                    checked={serviceIds.includes(s.id)}
                    onCheckedChange={(checked) =>
                      setServiceIds((prev) =>
                        checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                      )
                    }
                  />
                  <Label htmlFor={`svc-${s.id}`} className="text-sm font-normal">
                    {s.name}
                  </Label>
                </div>
              ))}
              {(services ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay servicios cargados todavía.</p>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
