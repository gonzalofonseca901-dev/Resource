import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { getCurrentUser, getBusiness, getActiveImpersonationForUser } from "@/lib/data"

export default async function BackofficeLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [business, impersonation] = await Promise.all([
    getBusiness(),
    getActiveImpersonationForUser(user.id),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      {impersonation && (
        <ImpersonationBanner sessionId={impersonation.id} targetBusinessName={impersonation.targetBusinessName} />
      )}
      <AppHeader
        userName={user.fullName}
        roleName={user.role.name}
        businessName={business.name}
        isAgencyAdmin={user.isAgencyAdmin}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
