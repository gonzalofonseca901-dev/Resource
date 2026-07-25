import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { currency } from "@/lib/mock-data";
import { fetchAppointments, type AppointmentWithRawStatus } from "@/lib/data/appointments";
import { useBusinessContext } from "@/lib/business-context";
import { NewAppointmentDialog } from "@/components/dialogs/new-appointment-dialog";
import { AppointmentDetailDialog } from "@/components/dialogs/appointment-detail-dialog";
import { RescheduleAppointmentDialog } from "@/components/dialogs/reschedule-appointment-dialog";

export const Route = createFileRoute("/backoffice/agenda")({
  component: AgendaPage,
});

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 to 19

function AppointmentCard({ a, onClick }: { a: AppointmentWithRawStatus; onClick: () => void }) {
  const start = new Date(a.date);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="rounded-md border bg-card p-2 text-xs shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium truncate">{a.clientName}</span>
        <Badge
          variant={
            a.status === "confirmado"
              ? "default"
              : a.status === "pendiente"
                ? "secondary"
                : "outline"
          }
          className="shrink-0 text-[10px]"
        >
          {a.status}
        </Badge>
      </div>
      <p className="truncate text-muted-foreground">{a.service}</p>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>
          {start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {a.duration}
          m
        </span>
        <span>{currency(a.price)}</span>
      </div>
    </div>
  );
}

function AgendaPage() {
  const { app_business_id: businessId } = useBusinessContext();
  const [dayOffset, setDayOffset] = useState(0);
  const [staffFilter, setStaffFilter] = useState<string>("todos");
  const [selected, setSelected] = useState<AppointmentWithRawStatus | null>(null);
  const [rescheduling, setRescheduling] = useState<AppointmentWithRawStatus | null>(null);

  const {
    data: appointments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["appointments", businessId],
    queryFn: () => fetchAppointments(businessId!),
    enabled: Boolean(businessId),
  });

  const staffNames = Array.from(new Set((appointments ?? []).map((a) => a.staff)));

  const day = new Date();
  day.setDate(day.getDate() + dayOffset);

  const dayAppts = (appointments ?? []).filter((a) => {
    const d = new Date(a.date);
    const sameDay = d.toDateString() === day.toDateString();
    const staffOk = staffFilter === "todos" || a.staff === staffFilter;
    return sameDay && staffOk;
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando agenda...</div>;
  }
  if (isError) {
    return <div className="p-6 text-sm text-destructive">No se pudo cargar la agenda.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Vista diaria de turnos por profesional."
        actions={
          <>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo el equipo</SelectItem>
                {staffNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NewAppointmentDialog businessId={businessId!} />
          </>
        }
      />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[220px] text-center">
              <div className="text-sm font-medium capitalize">
                {day.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="text-xs text-muted-foreground">{dayAppts.length} turnos</div>
            </div>
            <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>
            Hoy
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[60px_1fr] divide-x">
            <div>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex h-20 items-start justify-end px-2 pt-1 text-xs text-muted-foreground border-b last:border-b-0"
                >
                  {h}:00
                </div>
              ))}
            </div>
            <div className="relative">
              {HOURS.map((h) => (
                <div key={h} className="h-20 border-b last:border-b-0 hover:bg-muted/30" />
              ))}
              {dayAppts.map((a) => {
                const d = new Date(a.date);
                const startMin = (d.getHours() - HOURS[0]) * 60 + d.getMinutes();
                const top = (startMin / 60) * 80;
                const height = (a.duration / 60) * 80 - 4;
                if (top < 0 || top > HOURS.length * 80) return null;
                return (
                  <div key={a.id} className="absolute left-2 right-2" style={{ top, height }}>
                    <AppointmentCard a={a} onClick={() => setSelected(a)} />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
      <AppointmentDetailDialog
        appointment={selected}
        businessId={businessId!}
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        onReschedule={() => {
          setRescheduling(selected);
          setSelected(null);
        }}
      />
      <RescheduleAppointmentDialog
        appointment={rescheduling}
        businessId={businessId!}
        open={Boolean(rescheduling)}
        onOpenChange={(o) => !o && setRescheduling(null)}
      />
    </div>
  );
}
