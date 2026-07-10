"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Repeat,
  Settings,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  userName: string
  roleName: string
  businessName: string
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/reservas", label: "Reservas", icon: ListChecks },
  { href: "/turnos-fijos", label: "Turnos fijos", icon: Repeat },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/recursos", label: "Recursos", icon: LayoutGrid },
  { href: "/analytics", label: "Analítica", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

export function AppHeader({ userName, roleName, businessName }: AppHeaderProps) {
  const pathname = usePathname()

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="size-3 rounded-sm border-2 border-primary-foreground" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-semibold sm:inline">{businessName}</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleName}</p>
          </div>
          <span
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
            aria-hidden="true"
          >
            {initials}
          </span>
        </div>
      </div>
    </header>
  )
}
