import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus } from "lucide-react";
import { createService } from "@/lib/data/services";

export function NewServiceDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    categoryName: "",
    durationMinutes: "30",
    price: "",
    imageUrl: "",
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createService(businessId, {
        name: form.name,
        categoryName: form.categoryName,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        imageUrl: form.imageUrl,
      }),
    onSuccess: () => {
      toast.success("Servicio creado");
      queryClient.invalidateQueries({ queryKey: ["services", businessId] });
      setForm({ name: "", categoryName: "", durationMinutes: "30", price: "", imageUrl: "" });
      setOpen(false);
    },
    onError: () => toast.error("No se pudo crear el servicio"),
  });

  const valid =
    form.name && form.categoryName && Number(form.durationMinutes) > 0 && Number(form.price) >= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nuevo servicio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo servicio</DialogTitle>
          <DialogDescription>
            Si la categoría no existe todavía, se crea sola con este nombre.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del servicio</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Input
              placeholder="Ej: Depilación láser"
              value={form.categoryName}
              onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
            />
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            Crear servicio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
