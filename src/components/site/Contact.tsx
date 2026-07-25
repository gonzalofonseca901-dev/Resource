import { MapPin, Clock, Instagram, Facebook, MessageCircle } from "lucide-react";
import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";
import { BookNowTrigger } from "@/components/booking/book-now-trigger";

export function Contact() {
  const { contact, business } = useSiteConfig();
  return (
    <section id="contacto" className="bg-primary py-20 text-primary-foreground sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/85">
            {contact.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{contact.title}</h2>
          <p className="mt-4 text-base text-white/90 sm:text-lg">{contact.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="overflow-hidden rounded-3xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-white/20">
              <iframe
                title={`Ubicación ${business.name} en ${business.city}`}
                src={business.mapEmbedUrl}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">{business.address}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">{business.hours}</p>
              </div>
            </div>
          </Reveal>

          <Reveal className="flex flex-col justify-center gap-5 rounded-3xl bg-white p-8 text-foreground shadow-xl">
            <div>
              <h3 className="font-display text-2xl font-bold">{contact.cardTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{contact.cardSubtitle}</p>
            </div>
            <BookNowTrigger
              label="Reservar turno online"
              fallbackHref={business.whatsappUrl}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-dark hover:shadow-lg"
            />
            <a
              href={business.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary/30 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary-light"
            >
              <MessageCircle className="h-4 w-4" />
              {contact.ctaLabel}
            </a>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground">{contact.followLabel}</span>
              <a
                href={business.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-11 w-11 place-items-center rounded-full bg-primary-light text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={business.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-11 w-11 place-items-center rounded-full bg-primary-light text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
