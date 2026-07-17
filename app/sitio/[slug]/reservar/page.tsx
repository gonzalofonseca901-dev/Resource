import { notFound } from "next/navigation"
import {
  getPublicBusinessBySlug,
  getPublicLocations,
  getPublicResourcesByLocation,
  getPublicPricingByResource,
  cheapestPrice,
} from "@/lib/data/public"
import { getPublicTheme } from "@/lib/public-theme"
import { BookingFlow, type BookableResource } from "@/components/public/booking-flow"

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const business = await getPublicBusinessBySlug(slug)
  if (!business) notFound()

  const theme = getPublicTheme(business.settings.theme)
  const locations = await getPublicLocations(business.id)

  const bookableResources: BookableResource[] = (
    await Promise.all(
      locations.map(async (location) => {
        const resources = await getPublicResourcesByLocation(location.id)
        return Promise.all(
          resources.map(async (resource) => ({
            id: resource.id,
            name: resource.name,
            locationName: location.name,
            timezone: location.timezone,
            price: cheapestPrice(await getPublicPricingByResource(resource.id)),
          })),
        )
      }),
    )
  ).flat()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
      <div>
        <h1 className={`${theme.headlineClass} text-4xl`}>Reservar en {business.name}</h1>
        <p className="mt-2 text-sm opacity-70">Elegí recurso, día y horario. Confirmamos al toque.</p>
      </div>
      <BookingFlow theme={theme} resources={bookableResources} />
    </div>
  )
}
