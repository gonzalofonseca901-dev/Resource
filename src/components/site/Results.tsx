import { useRef, useState, useCallback, useEffect } from "react";
import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";

function BeforeAfter({
  before,
  after,
  beforeAlt,
  afterAlt,
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      setFromClientX(x);
    };
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [setFromClientX]);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-3xl bg-primary-light"
      onMouseDown={(e) => {
        dragging.current = true;
        setFromClientX(e.clientX);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        setFromClientX(e.touches[0].clientX);
      }}
    >
      <img
        src={after}
        alt={afterAlt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img src={before} alt={beforeAlt} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
        Antes
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
        Después
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
        style={{ left: `${pos}%` }}
      >
        <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-lg">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
              <polyline points="9 18 15 12 9 6" transform="translate(0 0)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Results() {
  const { results } = useSiteConfig();
  return (
    <section id="resultados" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {results.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{results.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{results.subtitle}</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.items.map((it, i) => (
            <Reveal key={i} style={{ transitionDelay: `${i * 80}ms` }}>
              <BeforeAfter {...it} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
