import { notFound } from "next/navigation"
import { getBusinessAdminDetail, getActivePlans, getModuleCatalog } from "@/lib/data"
import { BusinessDetailPanel } from "@/components/admin/business-detail-panel"

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [business, plans, moduleCatalog] = await Promise.all([
    getBusinessAdminDetail(id),
    getActivePlans(),
    getModuleCatalog(),
  ])

  if (!business) notFound()

  return <BusinessDetailPanel business={business} plans={plans} moduleCatalog={moduleCatalog} />
}
