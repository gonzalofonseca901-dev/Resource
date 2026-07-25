import { Reveal } from "./Reveal";
import { useSiteConfig } from "@/lib/tenant-context";

export function Team() {
  const { team } = useSiteConfig();
  return (
    <section id="equipo" className="bg-primary-light/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {team.eyebrow}
          </p>
          <h2 className="font-rounded text-4xl sm:text-5xl">{team.title}</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
          {team.members.map((m, i) => (
            <Reveal
              key={m.name}
              style={{ transitionDelay: `${i * 60}ms` }}
              className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-[0_6px_24px_-14px_rgba(44,44,42,0.2)] ring-1 ring-border"
            >
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-display text-2xl font-bold text-primary-foreground">
                {m.initials}
              </div>
              <h3 className="mt-4 text-base font-bold sm:text-lg">{m.name}</h3>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{m.role}</p>
              <p className="mt-3 text-sm text-muted-foreground">"{m.quote}"</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
