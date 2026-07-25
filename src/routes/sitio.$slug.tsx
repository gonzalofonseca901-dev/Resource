import { createFileRoute, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { Faq } from "@/components/site/Faq";
import { Team } from "@/components/site/Team";
import { Results } from "@/components/site/Results";
import { News } from "@/components/site/News";
import { Testimonials } from "@/components/site/Testimonials";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { BrandStyle } from "@/components/shared/BrandStyle";
import { TenantProvider } from "@/lib/tenant-context";
import { getTenantBySlug } from "@/lib/tenants";
import { fetchRealSiteConfig } from "@/lib/data/site-config";

export const Route = createFileRoute("/sitio/$slug")({
  // Arranca del registro mock (que sigue teniendo la copy de marketing:
  // FAQ, testimonios, resultados) y le superpone los datos reales del
  // negocio desde Supabase (marca, servicios, equipo, novedades, contacto)
  // si existe un negocio real con ese slug. Si no hay fila real todavía,
  // se muestra la landing 100% con el mock, sin romper nada.
  loader: async ({ params }) => {
    const mockTenant = getTenantBySlug(params.slug);
    if (!mockTenant) throw notFound();
    const site = await fetchRealSiteConfig(params.slug, mockTenant.site);
    return { tenant: { ...mockTenant, site } };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { site } = loaderData.tenant;
    return {
      meta: [
        { title: site.seo.title },
        { name: "description", content: site.seo.description },
        { property: "og:title", content: site.seo.title },
        { property: "og:description", content: site.seo.description },
        { property: "og:type", content: "website" },
        {
          property: "og:image:alt",
          content: `${site.business.name} ${site.business.tagline.toLowerCase()} en ${site.business.city}`,
        },
        { property: "og:locale", content: site.business.locale },
      ],
    };
  },
  component: PublicSite,
});

function PublicSite() {
  const { tenant } = Route.useLoaderData();

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen bg-background">
        <BrandStyle />
        <Navbar />
        <main>
          <Hero />
          <Services />
          <Faq />
          <Team />
          <Results />
          <News />
          <Testimonials />
          <Contact />
        </main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </TenantProvider>
  );
}
