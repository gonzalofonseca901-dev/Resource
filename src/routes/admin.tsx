import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Building2, CreditCard, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const navItems = [
  { title: "Negocios", url: "/admin/negocios", icon: Building2 },
  { title: "Planes", url: "/admin/planes", icon: CreditCard },
  { title: "Auditoría", url: "/admin/auditoria", icon: ShieldCheck },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background text-xs font-bold">
              PL
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Panel de plataforma</p>
              <p className="text-xs text-muted-foreground">
                No es lo que ve cada negocio — esto es tuyo
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.url);
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
