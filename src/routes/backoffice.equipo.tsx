import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  fetchStaff,
  toggleProfessionalActive,
  type StaffMemberWithServiceIds,
} from "@/lib/data/staff";
import { useBusinessContext } from "@/lib/business-context";
import { NewStaffDialog } from "@/components/dialogs/new-staff-dialog";
import { EditStaffDialog } from "@/components/dialogs/edit-staff-dialog";

export const Route = createFileRoute("/backoffice/equipo")({
  component: StaffPage,
});

function StaffPage() {
  const { app_business_id: businessId } = useBusinessContext();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<StaffMemberWithServiceIds | null>(null);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleProfessionalActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", businessId] }),
    onError: () => toast.error("No se pudo actualizar el estado"),
  });

  const {
    data: staff,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["staff", businessId],
    queryFn: () => fetchStaff(businessId!),
    enabled: Boolean(businessId),
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando equipo...</div>;
  }
  if (isError) {
    return <div className="p-6 text-sm text-destructive">No se pudo cargar el equipo.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Profesionales, roles y especialidades."
        actions={<NewStaffDialog businessId={businessId!} />}
      />
      <div className="p-6 pb-0">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar profesional..."
            className="pl-9"
          />
        </div>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {(staff ?? [])
          .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
          .map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0 cursor-pointer" onClick={() => setEditing(s)}>
                    <h3 className="font-medium truncate hover:underline">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.role}</p>
                  </div>
                  <Badge
                    variant={s.active ? "default" : "secondary"}
                    className="ml-auto cursor-pointer"
                    onClick={() => toggleMutation.mutate({ id: s.id, active: !s.active })}
                  >
                    {s.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.email ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {s.email}
                  </div>
                ) : null}
                {s.services.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Especialidades</p>
                    <div className="flex flex-wrap gap-1">
                      {s.services.map((sv) => (
                        <Badge key={sv} variant="outline" className="text-[10px]">
                          {sv}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sin especialidades asignadas
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        {(staff ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay profesionales cargadas.</p>
        ) : null}
      </div>
      <EditStaffDialog
        staff={editing}
        businessId={businessId!}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
