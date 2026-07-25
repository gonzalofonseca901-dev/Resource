import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateProfessional } from "@/lib/data/staff";
import { fetchServices } from "@/lib/data/services";
import type { StaffMemberWithServiceIds } from "@/lib/data/staff";

export function EditStaffDialog({
  staff,
  businessId,
  open,
  onOpenChange,
}: {
  staff: StaffMemberWithServiceIds | null;
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({ name: "", bio: "" });
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => fetchServices(businessId),
    enabled: open,
  });

  useEffect(() => {
    if (staff) {
      setForm({ name: staff.name, bio: staff.role === "Profesional" ? "" : staff.role });
      setServiceIds(staff.serviceIds);
    }
  }, [staff]);

  const mutation = useMutation({
    mutationFn: () => updateProfessional(staff!.id, { ...form, serviceIds }),
    onSuccess: () => {
      toast.success("Profesional actualizada");
      queryClient.invalidateQueries({ queryKey: ["staff", businessId] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo actualizar"),
  });

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar profesional</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Rol / especialidad</Label>
            <Textarea
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
                    id={`edit-svc-${s.id}`}
                    checked={serviceIds.includes(s.id)}
                    onCheckedChange={(checked) =>
                      setServiceIds((prev) =>
                        checked ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                      )
                    }
                  />
                  <Label htmlFor={`edit-svc-${s.id}`} className="text-sm font-normal">
                    {s.name}
                  </Label>
                </div>
              ))}
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
