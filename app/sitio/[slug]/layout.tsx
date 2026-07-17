import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { Oswald, Inter, Fraunces, Space_Grotesk, IBM_Plex_Sans } from "next/font/google"
import { getPublicBusinessBySlug } from "@/lib/data/public"
import { getPublicTheme } from "@/lib/public-theme"

// Las 3 familias de display, una por tema — se declaran todas acá (Next
// exige que las fuentes de next/font/google sean llamadas a nivel de
// módulo, no condicionalmente) y se aplica solo la del tema activo vía CSS
// var en el body. El resto queda sin usar en el bundle de ESE negocio
// puntual, pero Next las trata como estáticas de todos modos — no vale la
// pena el costo de complejidad de cargarlas dinámicamente para esto.
const courtDisplay = Oswald({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-court-display" })
const courtBody = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-court-body" })
const studioDisplay = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-studio-display" })
const studioBody = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-studio-body" })
const clinicDisplay = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-clinic-display" })
const clinicBody = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-clinic-body" })

const ALL_FONT_VARS = [
  courtDisplay.variable,
  courtBody.variable,
  studioDisplay.variable,
  studioBody.variable,
  clinicDisplay.variable,
  clinicBody.variable,
].join(" ")

export default async function PublicSiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const business = await getPublicBusinessBySlug(slug)
  if (!business) notFound()

  const theme = getPublicTheme(business.settings.theme)

  return (
    <div
      className={`${ALL_FONT_VARS} ${theme.bodyClass} min-h-screen`}
      style={{ ["--accent" as string]: business.settings.accentColor }}
    >
      {children}
    </div>
  )
}
