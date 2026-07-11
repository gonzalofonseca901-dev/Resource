import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import { getCurrentUser, getBusiness } from "@/lib/data"

export default async function BackofficeLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const business = await getBusiness()

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        userName={user.fullName}
        roleName={user.role.name}
        businessName={business.name}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
