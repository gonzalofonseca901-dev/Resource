import { getAllPlansForAdmin, getModuleCatalog } from "@/lib/data"
import { PlansManager } from "@/components/admin/plans-manager"

export default async function AdminPlansPage() {
  const [plans, moduleCatalog] = await Promise.all([getAllPlansForAdmin(), getModuleCatalog()])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de planes de la plataforma. Editar un plan no cambia automáticamente los
          módulos de los negocios que ya lo tienen asignado — hay que reaplicarlo desde el
          detalle de cada negocio si corresponde.
        </p>
      </div>
      <PlansManager plans={plans} moduleCatalog={moduleCatalog} />
    </div>
  )
}
