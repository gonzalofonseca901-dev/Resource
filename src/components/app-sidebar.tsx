import { Link, useRouterState } from "@tanstack/react-router";
import { useTenant } from "@/lib/tenant-context";
import {
  Calendar,
  LayoutDashboard,
  Users,
  Scissors,
  UserCog,
  BarChart3,
  Bell,
  Settings,
  CreditCard,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Inicio", url: "/backoffice", icon: LayoutDashboard },
  { title: "Agenda", url: "/backoffice/agenda", icon: Calendar },
  { title: "Clientes", url: "/backoffice/clientes", icon: Users },
  { title: "Servicios", url: "/backoffice/servicios", icon: Scissors },
  { title: "Equipo", url: "/backoffice/equipo", icon: UserCog },
];

const secondaryItems = [
  { title: "Reportes", url: "/backoffice/reportes", icon: BarChart3 },
  { title: "Notificaciones", url: "/backoffice/notificaciones", icon: Bell },
  { title: "Plan", url: "/backoffice/plan", icon: CreditCard },
  { title: "Ajustes", url: "/backoffice/ajustes", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/backoffice" ? pathname === "/backoffice" : pathname.startsWith(url);
  const tenant = useTenant();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">{tenant.site.business.name}</span>
            <span className="text-xs text-muted-foreground">Panel de gestión</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            AM
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">Agus Mendoza</span>
            <span className="text-xs text-muted-foreground">Admin · Centro Palermo</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
