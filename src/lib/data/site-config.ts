import { supabase } from "@/lib/supabase";
import type { SiteConfig } from "@/config/siteConfig";
import { shadeColor, lighten } from "@/lib/color";

/**
 * Qué overridea con datos reales y qué se queda con el mock, a propósito:
 *
 * REAL (Supabase):  nombre del negocio, colores/logo, dirección/teléfono
 *                    (+ mapa y WhatsApp derivados de ahí), catálogo de
 *                    servicios, equipo, novedades.
 * MOCK (queda como está): FAQ, testimonios, resultados antes/después,
 *                    textos de hero/nav/footer — son copy de marketing que
 *                    nunca modelamos en la base (a propósito, ver el
 *                    análisis de "qué es núcleo vs qué es contenido" del
 *                    modelo de datos). Si en el futuro se quiere que sean
 *                    editables por negocio, son tablas nuevas, no un bug
 *                    de este mapper.
 *
 * Si el negocio real todavía no tiene servicios/equipo/novedades cargados
 * (recién arrancando), se queda con los del mock para esa sección
 * puntual, para no mostrar una landing vacía mientras cargan datos.
 */
export async function fetchRealSiteConfig(slug: string, mockBase: SiteConfig): Promise<SiteConfig> {
  const { data: profile, error } = await supabase
    .from("public_business_profile")
    .select("id, name, timezone, primary_color, secondary_color, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !profile) return mockBase; // sin negocio real con ese slug, se queda 100% con el mock

  const businessId = profile.id;

  const [{ data: location }, { data: services }, { data: professionals }, { data: posts }] =
    await Promise.all([
      supabase
        .from("locations")
        .select("address, phone")
        .eq("business_id", businessId)
        .eq("active", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("services")
        .select("name, description, image_url, service_categories ( name )")
        .eq("business_id", businessId)
        .eq("active", true),
      supabase
        .from("professionals")
        .select("name, bio")
        .eq("business_id", businessId)
        .eq("active", true),
      supabase
        .from("posts")
        .select("title, content, image_url, published_at")
        .eq("business_id", businessId)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(6),
    ]);

  const config: SiteConfig = {
    ...mockBase,
    business: {
      ...mockBase.business,
      id: profile.id,
      name: profile.name,
      address: location?.address ?? mockBase.business.address,
      phone: location?.phone ?? mockBase.business.phone,
      whatsappUrl: location?.phone
        ? `https://wa.me/${location.phone.replace(/\D/g, "")}`
        : mockBase.business.whatsappUrl,
      mapEmbedUrl: location?.address
        ? `https://www.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed`
        : mockBase.business.mapEmbedUrl,
    },
    brand: profile.primary_color
      ? {
          ...mockBase.brand,
          primaryColor: profile.primary_color,
          primaryDark: shadeColor(profile.primary_color, -30),
          primaryLight: lighten(profile.primary_color, 0.9),
          secondaryColor: profile.secondary_color ?? mockBase.brand.secondaryColor,
          logo: profile.logo_url
            ? { ...mockBase.brand.logo, pink: profile.logo_url, white: profile.logo_url }
            : mockBase.brand.logo,
        }
      : mockBase.brand,
    seo: {
      ...mockBase.seo,
      title: mockBase.seo.title.replace(mockBase.business.name, profile.name),
    },
  };

  if (services && services.length > 0) {
    config.services = {
      ...mockBase.services,
      items: services.map((s, i) => ({
        title: s.name,
        short: (s.description ?? "").slice(0, 90),
        long: s.description ?? "",
        image:
          s.image_url ?? mockBase.services.items[i % mockBase.services.items.length]?.image ?? "",
        imageAlt: s.name,
      })),
    };
  }

  if (professionals && professionals.length > 0) {
    config.team = {
      ...mockBase.team,
      members: professionals.map((p) => ({
        name: p.name,
        role: p.bio ?? "Profesional del equipo",
        quote: p.bio ?? "Comprometida con brindarte la mejor atención.",
        initials: p.name
          .split(" ")
          .map((n: string) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      })),
    };
  }

  if (posts && posts.length > 0) {
    config.news = {
      ...mockBase.news,
      posts: posts.map((p, i) => ({
        title: p.title,
        date: p.published_at
          ? new Date(p.published_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "",
        image:
          p.image_url ??
          mockBase.news.posts[i % Math.max(mockBase.news.posts.length, 1)]?.image ??
          "",
        excerpt: (p.content ?? "").slice(0, 140),
      })),
    };
  }

  return config;
}
