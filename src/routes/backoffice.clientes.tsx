import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { currency } from "@/lib/mock-data";
import { fetchClients } from "@/lib/data/clients";
import { useBusinessContext } from "@/lib/business-context";
import { NewClientDialog } from "@/components/dialogs/new-client-dialog";
import { EditClientDialog } from "@/components/dialogs/edit-client-dialog";
import type { Client } from "@/lib/mock-data";

export const Route = createFileRoute("/backoffice/clientes")({
  component: ClientsPage,
});

function ClientsPage() {
  const { app_business_id: businessId } = useBusinessContext();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);

  const {
    data: clients,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: () => fetchClients(businessId!),
    enabled: Boolean(businessId),
  });

  const filtered = (clients ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()) ||
      c.phone.includes(q),
  );

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando clientes...</div>;
  }
  if (isError) {
    return <div className="p-6 text-sm text-destructive">No se pudieron cargar los clientes.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients?.length ?? 0} clientes registrados.`}
        actions={<NewClientDialog businessId={businessId!} />}
      />
      <div className="p-6">
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-9"
          />
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead className="text-right">Total gastado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setEditing(c)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{c.totalVisits}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.lastVisit).toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell className="text-right font-medium">{currency(c.totalSpent)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    Sin resultados
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      </div>
      <EditClientDialog
        client={editing}
        businessId={businessId!}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
