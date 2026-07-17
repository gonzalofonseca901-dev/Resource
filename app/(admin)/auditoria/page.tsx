import { getCrossTenantAuditLog } from "@/lib/data"
import { AuditLogTable } from "@/components/admin/audit-log-table"

export default async function AdminAuditPage() {
  const entries = await getCrossTenantAuditLog()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Audit log — todos los negocios</h1>
        <p className="text-sm text-muted-foreground">
          Últimos {entries.length} eventos, de cualquier negocio. Mismo `audit_log` que ya
          existe (migración 001/007), sin el filtro de `business_id` gracias a la excepción
          de RLS de la migración 011.
        </p>
      </div>
      <AuditLogTable entries={entries} />
    </div>
  )
}
