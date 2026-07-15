import { getBusinessesForAdmin } from "@/lib/data"
import { BusinessesTable } from "@/components/admin/businesses-table"

export default async function AdminBusinessesPage() {
  const businesses = await getBusinessesForAdmin()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Negocios</h1>
        <p className="text-sm text-muted-foreground">
          {businesses.length} negocio{businesses.length === 1 ? "" : "s"} en la plataforma.
        </p>
      </div>
      <BusinessesTable businesses={businesses} />
    </div>
  )
}
