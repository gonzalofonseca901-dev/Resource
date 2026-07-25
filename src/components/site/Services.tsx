import { ServiceCard } from "./ServiceCard";
import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";

export function Services() {
  const { services } = useSiteConfig();
  return (
    <section id="servicios" className="bg-primary-light/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {services.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{services.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{services.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((s, i) => (
            <Reveal key={s.title} style={{ transitionDelay: `${i * 60}ms` }}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
