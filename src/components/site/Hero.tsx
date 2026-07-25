import { Sparkles, HeartHandshake, Zap, type LucideIcon } from "lucide-react";
import { useSiteConfig } from "@/lib/tenant-context";
import { BookNowTrigger } from "@/components/booking/book-now-trigger";

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  heart: HeartHandshake,
  sparkles: Sparkles,
};

export function Hero() {
  const { hero, business } = useSiteConfig();
  const primaryHref =
    hero.ctaPrimary.href === "__WHATSAPP__" ? business.whatsappUrl : hero.ctaPrimary.href;

  return (
    <section id="inicio" className="relative isolate overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <img
          src={hero.image}
          alt={hero.imageAlt}
          className="h-full w-full object-cover"
          width={1600}
          height={1000}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(232,99,126,0.45) 0%, rgba(201,79,104,0.5) 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-5 py-16 text-white sm:px-6 sm:py-24">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.28em] text-white/90">
          {hero.eyebrow}
        </p>
        <h1 className="font-rounded text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          {hero.headlineLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < hero.headlineLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/95 sm:text-xl">{hero.subheadline}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <BookNowTrigger
            label={hero.ctaPrimary.label}
            fallbackHref={primaryHref}
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-primary shadow-lg transition-all duration-300 hover:bg-primary-light hover:shadow-xl"
          />
          <a
            href={hero.ctaSecondary.href}
            className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/80 bg-transparent px-8 text-base font-semibold text-white transition-all duration-300 hover:bg-white/10"
          >
            {hero.ctaSecondary.label}
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
          {hero.badges.map(({ icon, text }) => {
            const Icon = iconMap[icon] ?? Sparkles;
            return (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
