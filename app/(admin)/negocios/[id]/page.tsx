import { notFound } from "next/navigation"
import { getBusinessAdminDetail, getActivePlans } from "@/lib/data"
import { BusinessDetailPanel } from "@/components/admin/business-detail-panel"

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [business, plans] = await Promise.all([getBusinessAdminDetail(id), getActivePlans()])

  if (!business) notFound()

  return <BusinessDetailPanel business={business} plans={plans} />
}
