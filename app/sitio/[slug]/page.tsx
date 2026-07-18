import { notFound } from "next/navigation"
import Link from "next/link"
import {
  getPublicBusinessBySlug,
  getPublicLocations,
  getPublicResourcesByLocation,
  getPublicPricingByResource,
  cheapestPrice,
} from "@/lib/data/public"
import { getPublicTheme } from "@/lib/public-theme"
import { publicHref } from "@/lib/public-links"

const HERO_COPY: Record<string, { eyebrow: string; verb: string }> = {
  court: { eyebrow: "Reservá tu cancha", verb: "Elegí día, horario y listo" },
  studio: { eyebrow: "Reservá tu turno", verb: "Un lugar para vos, cuando lo necesites" },
  clinic: { eyebrow: "Reservá tu turno", verb: "Coordiná tu consulta en un par de clicks" },
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const business = await getPublicBusinessBySlug(slug)
  if (!business) notFound()

  const theme = getPublicTheme(business.settings.theme)
  const hero = HERO_COPY[theme.key] ?? HERO_COPY.court

  const locations = await getPublicLocations(business.id)
  const locationsWithResources = await Promise.all(
    locations.map(async (location) => {
      const resources = await getPublicResourcesByLocation(location.id)
      const resourcesWithPrice = await Promise.all(
        resources.map(async (resource) => ({
          resource,
          cheapest: cheapestPrice(await getPublicPricingByResource(resource.id)),
        })),
      )
      return { location, resourcesWithPrice }
    }),
  )

  const reservarHref = await publicHref(slug, "reservar")

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16 sm:px-10">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        {business.settings.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.settings.logoUrl} alt={business.name} className="h-12 w-auto object-contain" />
        )}
        <span className="text-sm font-medium uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
          {hero.eyebrow}
        </span>
        <h1 className={`${theme.headlineClass} text-5xl sm:text-6xl`}>{business.name}</h1>
        <p className="max-w-xl text-lg opacity-80">{hero.verb}.</p>
        <div>
          <Link
            href={reservarHref}
            className={`${theme.buttonClass} inline-flex items-center px-6 py-3 text-sm`}
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Reservar ahora
          </Link>
        </div>
      </header>

      {/* Sedes y recursos */}
      <section className="flex flex-col gap-10">
        {locationsWithResources.map(({ location, resourcesWithPrice }) => (
          <div key={location.id} className="flex flex-col gap-4">
            <div>
              <h2 className={`${theme.headlineClass} text-2xl`}>{location.name}</h2>
              {location.address && <p className="text-sm opacity-70">{location.address}{location.city ? `, ${location.city}` : ""}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resourcesWithPrice.map(({ resource, cheapest }) => (
                <div key={resource.id} className={`${theme.cardClass} ${theme.radiusClass} flex flex-col gap-2 p-5`}>
                  <span className="font-semibold">{resource.name}</span>
                  {resource.description && <p className="text-sm opacity-70">{resource.description}</p>}
                  {cheapest && (
                    <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                      Desde {cheapest.currency} {cheapest.price.toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
              ))}
              {resourcesWithPrice.length === 0 && (
                <p className="text-sm opacity-60">Sin recursos cargados en esta sede todavía.</p>
              )}
            </div>
          </div>
        ))}
        {locationsWithResources.length === 0 && (
          <p className="text-sm opacity-60">Este negocio todavía no cargó sedes.</p>
        )}
      </section>

      <footer className="flex flex-col gap-1 border-t border-current/10 pt-6 text-sm opacity-60">
        {business.phone && <span>{business.phone}</span>}
        {business.email && <span>{business.email}</span>}
      </footer>
    </div>
  )
}
