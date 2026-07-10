import { formatDateLong } from "@/lib/date-utils"

interface DashboardHeaderProps {
  userName: string
  locationsLabel: string
}

export function DashboardHeader({ userName, locationsLabel }: DashboardHeaderProps) {
  const firstName = userName.split(" ")[0]
  const today = formatDateLong(new Date())

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-tight text-balance">
        Hola, {firstName}
      </h1>
      <p className="text-sm capitalize text-muted-foreground">{today}</p>
      <p className="text-xs text-muted-foreground">{locationsLabel}</p>
    </div>
  )
}
