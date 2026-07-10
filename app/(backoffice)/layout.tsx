import type { ReactNode } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { getCurrentUser } from "@/lib/data"
import { MOCK_BUSINESS } from "@/lib/mock-data"

export default async function BackofficeLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        userName={user.fullName}
        roleName={user.role.name}
        businessName={MOCK_BUSINESS.name}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
