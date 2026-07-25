import { NewsCard } from "./NewsCard";
import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";

export function News() {
  const { news } = useSiteConfig();
  return (
    <section id="novedades" className="bg-primary-light/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {news.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{news.title}</h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.posts.map((p, i) => (
            <Reveal key={p.title} style={{ transitionDelay: `${i * 60}ms` }}>
              <NewsCard post={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
