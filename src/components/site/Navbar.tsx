import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useSiteConfig } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";
import { BookNowTrigger } from "@/components/booking/book-now-trigger";

export function Navbar() {
  const { nav, business } = useSiteConfig();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)]"
          : "bg-white shadow-[0_2px_16px_-6px_rgba(0,0,0,0.08)]",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#inicio" className="flex items-center" aria-label="Ir al inicio">
          <Logo size="sm" />
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {nav.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <BookNowTrigger
            label={nav.ctaLabel}
            fallbackHref={business.whatsappUrl}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-dark hover:shadow-lg"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-dark hover:shadow-lg lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Logo size="sm" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <ul className="flex flex-col gap-1 px-3 py-5">
            {nav.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary"
                >
                  {l.label}
                  <span className="text-primary">›</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto border-t border-border p-5">
            <BookNowTrigger
              label={nav.ctaLabel}
              fallbackHref={business.whatsappUrl}
              onNavigate={() => setOpen(false)}
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-dark"
            />
          </div>
        </aside>
      </div>
    </header>
  );
}
