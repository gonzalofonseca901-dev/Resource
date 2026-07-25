import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { useSiteConfig } from "@/lib/tenant-context";

export function Footer() {
  const { business, footer } = useSiteConfig();
  return (
    <footer className="bg-primary-light py-10 text-foreground">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo variant="pink" size="md" />

          <div className="flex items-center gap-3">
            <a
              href={business.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-soft transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={business.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-soft transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={business.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-soft transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>

          <a
            href={business.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-dark hover:shadow-lg"
          >
            <MessageCircle className="h-4 w-4" />
            {footer.ctaLabel}
          </a>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {business.name} · {business.copyrightSuffix}
          </p>
        </div>
      </div>
    </footer>
  );
}
