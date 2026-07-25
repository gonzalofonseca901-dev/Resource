import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";

export function Testimonials() {
  const { testimonials } = useSiteConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      if (!paused) {
        el.scrollLeft += 0.4;
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const items = [...testimonials.items, ...testimonials.items];

  return (
    <section id="testimonios" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {testimonials.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{testimonials.title}</h2>
        </Reveal>
      </div>

      <Reveal className="mt-12">
        <div
          ref={scrollRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="flex gap-5 overflow-x-hidden px-5 sm:px-6"
          style={{ scrollBehavior: "auto" }}
        >
          {items.map((t, i) => (
            <article
              key={i}
              className="flex w-[300px] shrink-0 flex-col rounded-3xl bg-white p-6 shadow-[0_6px_24px_-14px_rgba(44,44,42,0.2)] ring-1 ring-border sm:w-[340px]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-bold text-primary-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <div className="flex gap-0.5 text-primary">
                    {Array.from({ length: t.rating }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
