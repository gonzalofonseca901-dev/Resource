import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { CheckCircle2, ChevronLeft } from "lucide-react";
import {
  fetchBookableServices,
  fetchProfessionalsForService,
  fetchPrimaryLocationId,
  fetchAvailableSlots,
  bookAppointment,
  type BookableService,
  type BookableProfessional,
  type AvailableSlot,
} from "@/lib/data/booking";

type Step = "service" | "professional" | "slot" | "contact" | "success";

export function BookingDialog({
  businessId,
  open,
  onOpenChange,
}: {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<BookableService | null>(null);
  const [professional, setProfessional] = useState<BookableProfessional | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function reset() {
    setStep("service");
    setService(null);
    setProfessional(null);
    setSlot(null);
    setContact({ name: "", phone: "", email: "" });
    setErrorMsg(null);
  }

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["public-services", businessId],
    queryFn: () => fetchBookableServices(businessId),
    enabled: open,
  });

  const { data: professionals, isLoading: loadingPros } = useQuery({
    queryKey: ["public-professionals", businessId, service?.id],
    queryFn: () => fetchProfessionalsForService(businessId, service!.id),
    enabled: open && Boolean(service),
  });

  const { data: locationId } = useQuery({
    queryKey: ["public-location", businessId],
    queryFn: () => fetchPrimaryLocationId(businessId),
    enabled: open,
  });

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["public-slots", businessId, locationId, service?.id, professional?.id, date],
    queryFn: () =>
      fetchAvailableSlots({
        businessId,
        locationId: locationId!,
        serviceId: service!.id,
        professionalId: professional!.id,
        date,
      }),
    enabled:
      open && Boolean(locationId) && Boolean(service) && Boolean(professional) && Boolean(date),
  });

  const mutation = useMutation({
    mutationFn: () =>
      bookAppointment({
        businessId,
        locationId: locationId!,
        serviceId: service!.id,
        professionalId: professional!.id,
        startAt: new Date(slot!.start),
        clientName: contact.name,
        clientPhone: contact.phone,
        clientEmail: contact.email,
      }),
    onSuccess: () => setStep("success"),
    onError: (err: unknown) => {
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo completar la reserva, probá de nuevo.",
      );
    },
  });

  const contactValid = contact.name.trim().length > 1 && contact.phone.trim().length > 5;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-md">
        {step !== "service" && step !== "success" ? (
          <button
            type="button"
            className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setErrorMsg(null);
              if (step === "professional") setStep("service");
              else if (step === "slot") setStep("professional");
              else if (step === "contact") setStep("slot");
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Volver
          </button>
        ) : null}

        {step === "service" && (
          <>
            <DialogHeader>
              <DialogTitle>Reservá tu turno</DialogTitle>
              <DialogDescription>Elegí el tratamiento que querés reservar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loadingServices ? (
                <p className="text-sm text-muted-foreground">Cargando servicios...</p>
              ) : null}
              {(services ?? []).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full rounded-md border p-3 text-left text-sm hover:border-primary hover:bg-primary/5"
                  onClick={() => {
                    setService(s);
                    setStep("professional");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">
                      ${s.price.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.durationMinutes} min</p>
                </button>
              ))}
              {!loadingServices && (services ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay servicios disponibles para reservar online.
                </p>
              ) : null}
            </div>
          </>
        )}

        {step === "professional" && service && (
          <>
            <DialogHeader>
              <DialogTitle>¿Con quién querés atenderte?</DialogTitle>
              <DialogDescription>{service.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loadingPros ? (
                <p className="text-sm text-muted-foreground">Cargando profesionales...</p>
              ) : null}
              {(professionals ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full rounded-md border p-3 text-left text-sm hover:border-primary hover:bg-primary/5"
                  onClick={() => {
                    setProfessional(p);
                    setStep("slot");
                  }}
                >
                  {p.name}
                </button>
              ))}
              {!loadingPros && (professionals ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay profesionales disponibles para este servicio todavía.
                </p>
              ) : null}
            </div>
          </>
        )}

        {step === "slot" && service && professional && (
          <>
            <DialogHeader>
              <DialogTitle>Elegí día y horario</DialogTitle>
              <DialogDescription>
                {service.name} · {professional.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                {loadingSlots ? (
                  <p className="col-span-3 text-sm text-muted-foreground">Buscando horarios...</p>
                ) : null}
                {(slots ?? []).map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    className={`rounded-md border p-2 text-xs hover:border-primary hover:bg-primary/5 ${
                      slot?.start === s.start ? "border-primary bg-primary/10" : ""
                    }`}
                    onClick={() => setSlot(s)}
                  >
                    {new Date(s.start).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
                {!loadingSlots && (slots ?? []).length === 0 ? (
                  <p className="col-span-3 text-sm text-muted-foreground">
                    No hay horarios libres ese día. Probá otra fecha.
                  </p>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!slot} onClick={() => setStep("contact")}>
                Continuar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "contact" && (
          <>
            <DialogHeader>
              <DialogTitle>Tus datos</DialogTitle>
              <DialogDescription>Para confirmarte el turno.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
              </div>
              {errorMsg ? <p className="text-sm text-destructive">{errorMsg}</p> : null}
            </div>
            <DialogFooter>
              <Button
                disabled={!contactValid || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? "Confirmando..." : "Confirmar turno"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <DialogTitle>¡Turno confirmado!</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Te esperamos{" "}
              {new Date(slot!.start).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              .
            </p>
            <Button onClick={() => onOpenChange(false)}>Listo</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
