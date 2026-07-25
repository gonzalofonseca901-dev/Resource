// Mock tenant registry. This is the ONE place that stands in for the future
// `businesses` table in Supabase. Every business (landing content + plan)
// lives here as a plain object, keyed by slug.
//
// When we wire the real backend, `getTenantBySlug` / `listTenants` become
// Supabase queries and this file goes away — nothing that *consumes* tenant
// data (components, routes) should need to change, since they only ever
// call these functions / the useTenant() hook, never import a business'
// data directly.

import heroImg from "@/assets/hero.jpg";
import laser from "@/assets/service-laser.jpg";
import cavitacion from "@/assets/service-cavitacion.jpg";
import radio from "@/assets/service-radiofrecuencia.jpg";
import facial from "@/assets/service-facial.jpg";
import masajes from "@/assets/service-masajes.jpg";
import logoPink from "@/assets/logo-pink.png";
import logoWhite from "@/assets/logo-white.png";

import type { SiteConfig } from "@/config/siteConfig";

export type Plan = "basico" | "pro" | "premium";

export const PLAN_LABELS: Record<Plan, string> = {
  basico: "Básico",
  pro: "Pro",
  premium: "Premium",
};

// Mirrors the "dominio personalizado solo en el plan más alto" que vimos en
// pedix — mismo criterio, config centralizada en un solo lugar.
export const PLAN_ALLOWS_CUSTOM_DOMAIN: Record<Plan, boolean> = {
  basico: false,
  pro: false,
  premium: true,
};

export type TenantRecord = {
  id: string;
  slug: string;
  plan: Plan;
  customDomain: string | null;
  createdAt: string; // ISO
  site: SiteConfig;
};

const bewoman: TenantRecord = {
  id: "t_bewoman",
  slug: "bewoman",
  plan: "pro",
  customDomain: null,
  createdAt: "2025-11-03T00:00:00.000Z",
  site: {
    business: {
      name: "bewoman",
      tagline: "Centro de estética",
      address: "Av. Belgrano 123, Alta Gracia, Córdoba",
      city: "Alta Gracia",
      region: "Córdoba",
      country: "Argentina",
      hours: "Lun a Vie 9:00 – 20:00 · Sáb 9:00 – 14:00",
      phone: "+54 9 3547 000000",
      whatsappUrl:
        "https://wa.me/5493547000000?text=Hola%20bewoman!%20Quiero%20reservar%20un%20turno.",
      instagramUrl: "https://instagram.com/bewoman",
      facebookUrl: "https://facebook.com/bewoman",
      mapEmbedUrl: "https://www.google.com/maps?q=Alta+Gracia+Cordoba+Argentina&output=embed",
      locale: "es_AR",
      copyrightSuffix: "Centro de estética · Alta Gracia, Córdoba",
    },
    brand: {
      primaryColor: "#e8637e",
      primaryDark: "#c94f68",
      primaryLight: "#fbeaf0",
      secondaryColor: "#fbeaf0",
      primaryForeground: "#ffffff",
      logo: { pink: logoPink, white: logoWhite, alt: "bewoman logo", wordmark: "bewoman" },
    },
    seo: {
      title: "bewoman | Centro de Estética en Alta Gracia",
      description:
        "bewoman es un centro de estética unisex en Alta Gracia, Córdoba. Especialistas en depilación láser definitiva, cavitación, radiofrecuencia, faciales y masajes.",
    },
    nav: {
      ctaLabel: "Reservar turno",
      links: [
        { href: "#inicio", label: "Inicio" },
        { href: "#servicios", label: "Servicios" },
        { href: "#equipo", label: "Nuestro equipo" },
        { href: "#novedades", label: "Novedades" },
        { href: "#testimonios", label: "Testimonios" },
        { href: "#contacto", label: "Contacto" },
      ],
    },
    hero: {
      eyebrow: "Alta Gracia · Córdoba",
      headlineLines: ["Dejá de depilarte", "cada mes."],
      subheadline:
        "Depilación láser definitiva y tratamientos de bienestar en Alta Gracia. Resultados reales, sesión tras sesión.",
      image: heroImg,
      imageAlt: "Interior del centro de estética bewoman en Alta Gracia",
      ctaPrimary: { label: "Reservar turno", href: "__WHATSAPP__" },
      ctaSecondary: { label: "Ver servicios", href: "#servicios" },
      badges: [
        { icon: "zap", text: "Tecnología láser diodo" },
        { icon: "heart", text: "Atención personalizada" },
        { icon: "sparkles", text: "Unisex" },
      ],
    },
    services: {
      eyebrow: "Nuestros servicios",
      title: "Nuestros tratamientos",
      subtitle:
        "Cada piel es distinta. Por eso empezamos siempre con una evaluación personalizada.",
      items: [
        {
          title: "Depilación láser diodo",
          short: "Definitiva, segura y apta para todo tipo de piel.",
          long: "Trabajamos con láser diodo de última generación, que combina eficacia y confort. Evaluamos tu tipo de piel y vello para diseñar un plan de sesiones a medida, con seguimiento en cada visita.",
          image: laser,
          imageAlt: "Depilación láser diodo",
        },
        {
          title: "Cavitación",
          short: "Reducción localizada de grasa por ultrasonido.",
          long: "La cavitación utiliza ondas de ultrasonido de baja frecuencia para tratar depósitos localizados de grasa, complementando hábitos saludables. Un tratamiento no invasivo, ideal en combinación con radiofrecuencia.",
          image: cavitacion,
          imageAlt: "Tratamiento de cavitación corporal",
        },
        {
          title: "Radiofrecuencia",
          short: "Firmeza, tonicidad y estimulación del colágeno.",
          long: "La radiofrecuencia genera calor controlado en las capas profundas de la piel, estimulando la producción de colágeno. Se usa en rostro y cuerpo para mejorar la firmeza y la textura.",
          image: radio,
          imageAlt: "Tratamiento de radiofrecuencia",
        },
        {
          title: "Tratamientos faciales",
          short: "Limpieza profunda, hidratación y rejuvenecimiento.",
          long: "Rutinas faciales personalizadas: limpieza profunda, exfoliación, hidratación intensiva y protocolos anti-edad, adaptados a las necesidades reales de tu piel.",
          image: facial,
          imageAlt: "Tratamiento facial",
        },
        {
          title: "Masajes descontracturantes",
          short: "Alivio de tensiones y bienestar profundo.",
          long: "Masajes descontracturantes y relajantes con maniobras específicas para liberar tensiones acumuladas en espalda, cuello y hombros. Un espacio para reconectar con tu cuerpo.",
          image: masajes,
          imageAlt: "Masaje descontracturante",
        },
      ],
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Antes de tu primera sesión",
      subtitle: "Respondemos lo que más nos preguntan.",
      items: [
        {
          q: "¿Duele la depilación láser?",
          a: "La sensación varía según la zona y la sensibilidad de cada piel, pero la mayoría de nuestras clientas la describe como una leve molestia, no dolor. Nuestra tecnología por fibra óptica ayuda a minimizar la sensación.",
        },
        {
          q: "¿Cuántas sesiones necesito?",
          a: "Depende de la zona, el tipo de vello y tu piel, pero en general se recomiendan entre 6 y 10 sesiones espaciadas, ya que el vello crece en distintas etapas y hay que tratarlo en cada una.",
        },
        {
          q: "¿Qué cuidados debo tener antes y después?",
          a: "Evitar exposición solar directa antes y después de cada sesión, no depilarte con cera o pinza entre sesiones (sí podés rasurarte), e hidratar la piel diariamente.",
        },
        {
          q: "¿Sirve para todo tipo de piel?",
          a: "Sí, trabajamos con tecnología apta para distintos fototipos de piel. En tu primera consulta evaluamos tu caso particular.",
        },
      ],
    },
    team: {
      eyebrow: "Nuestro equipo",
      title: "Quiénes te van a acompañar",
      members: [
        {
          name: "Julieta Álvarez",
          role: "Cosmetóloga · Depilación láser",
          quote: "Me especializo en depilación láser y cuidado de la piel hace más de 8 años.",
          initials: "JA",
        },
        {
          name: "Camila Ríos",
          role: "Esteticista corporal",
          quote:
            "Diseño planes personalizados de tratamientos corporales para acompañarte en tu proceso.",
          initials: "CR",
        },
        {
          name: "Sofía Méndez",
          role: "Facialista",
          quote:
            "Trabajo cada piel como única, con protocolos a medida y productos de alta cosmética.",
          initials: "SM",
        },
        {
          name: "Martín López",
          role: "Masajista terapéutico",
          quote:
            "Combino técnicas descontracturantes y de relajación para liberar tensiones profundas.",
          initials: "ML",
        },
      ],
    },
    results: {
      eyebrow: "Antes y después",
      title: "Resultados reales",
      subtitle:
        "Deslizá la línea para ver el antes y el después. Imágenes de referencia, resultados obtenidos con nuestros tratamientos.",
      items: [
        { before: laser, after: laser, beforeAlt: "Antes", afterAlt: "Después" },
        { before: cavitacion, after: cavitacion, beforeAlt: "Antes", afterAlt: "Después" },
        { before: radio, after: radio, beforeAlt: "Antes", afterAlt: "Después" },
      ],
    },
    news: {
      eyebrow: "Blog",
      title: "Novedades y promos",
      posts: [
        {
          title: "Hot Sale bewoman: 12, 13 y 14 de mayo",
          date: "05 May 2025",
          image: radio,
          excerpt:
            "Descuentos especiales en depilación láser y packs de tratamientos corporales por tiempo limitado.",
        },
        {
          title: "¿Por qué salen vellitos encarnados?",
          date: "22 Abr 2025",
          image: laser,
          excerpt:
            "Te contamos por qué aparecen los vellos encarnados y cómo prevenirlos con una rutina simple.",
        },
        {
          title: "Cuidados de la piel al llegar el frío",
          date: "10 Abr 2025",
          image: facial,
          excerpt:
            "Consejos para mantener tu piel hidratada y luminosa durante los meses más secos del año.",
        },
      ],
    },
    testimonials: {
      eyebrow: "Testimonios",
      title: "Lo que dicen nuestras clientas",
      items: [
        {
          name: "Lucía G.",
          initials: "LG",
          rating: 5,
          text: "Me hice depilación láser de piernas completas y el cambio fue impresionante. Súper profesionales y siempre atentas.",
        },
        {
          name: "Mariana P.",
          initials: "MP",
          rating: 5,
          text: "El trato es hermoso, te explican todo el proceso y te acompañan en cada sesión. Recomendadísimo.",
        },
        {
          name: "Sol A.",
          initials: "SA",
          rating: 5,
          text: "Hice varios tratamientos corporales y el equipo es un amor. Los resultados se notan de verdad.",
        },
        {
          name: "Federico N.",
          initials: "FN",
          rating: 5,
          text: "Fui a hacerme depilación láser en la espalda y me sorprendió la atención. Muy cómodo, sin dolor.",
        },
        {
          name: "Belén R.",
          initials: "BR",
          rating: 5,
          text: "El lugar es divino y las chicas re canchera. Voy a seguir haciéndome todos los tratamientos ahí.",
        },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      title: "Reservá tu turno",
      subtitle: "Escribinos y te respondemos al toque.",
      cardTitle: "Escribinos por WhatsApp",
      cardSubtitle: "Coordinamos tu evaluación inicial y armamos un plan a tu medida.",
      ctaLabel: "Reservar por WhatsApp",
      followLabel: "Seguinos:",
    },
    footer: { ctaLabel: "Reservar turno" },
  },
};

// Segundo tenant, liviano pero completo, para probar que el mismo template
// sirve para un rubro/cliente distinto sin tocar código — solo datos.
const lunanails: TenantRecord = {
  id: "t_lunanails",
  slug: "lunanails",
  plan: "basico",
  customDomain: null,
  createdAt: "2026-06-18T00:00:00.000Z",
  site: {
    business: {
      name: "Luna Nails",
      tagline: "Estudio de uñas",
      address: "San Martín 456, Alta Gracia, Córdoba",
      city: "Alta Gracia",
      region: "Córdoba",
      country: "Argentina",
      hours: "Mar a Sáb 10:00 – 19:00",
      phone: "+54 9 3547 111111",
      whatsappUrl:
        "https://wa.me/5493547111111?text=Hola%20Luna%20Nails!%20Quiero%20reservar%20un%20turno.",
      instagramUrl: "https://instagram.com/lunanails",
      facebookUrl: "https://facebook.com/lunanails",
      mapEmbedUrl: "https://www.google.com/maps?q=Alta+Gracia+Cordoba+Argentina&output=embed",
      locale: "es_AR",
      copyrightSuffix: "Estudio de uñas · Alta Gracia, Córdoba",
    },
    brand: {
      primaryColor: "#7c5cff",
      primaryDark: "#5f43cc",
      primaryLight: "#efeaff",
      secondaryColor: "#efeaff",
      primaryForeground: "#ffffff",
      logo: { pink: logoPink, white: logoWhite, alt: "Luna Nails logo", wordmark: "luna nails" },
    },
    seo: {
      title: "Luna Nails | Estudio de uñas en Alta Gracia",
      description:
        "Luna Nails: esmaltado semipermanente, uñas esculpidas y nail art en Alta Gracia, Córdoba.",
    },
    nav: {
      ctaLabel: "Reservar turno",
      links: [
        { href: "#inicio", label: "Inicio" },
        { href: "#servicios", label: "Servicios" },
        { href: "#equipo", label: "Equipo" },
        { href: "#novedades", label: "Novedades" },
        { href: "#testimonios", label: "Testimonios" },
        { href: "#contacto", label: "Contacto" },
      ],
    },
    hero: {
      eyebrow: "Alta Gracia · Córdoba",
      headlineLines: ["Tus uñas,", "tu estilo."],
      subheadline:
        "Esmaltado semipermanente y nail art en Alta Gracia. Reservá tu turno en minutos.",
      image: heroImg,
      imageAlt: "Interior del estudio Luna Nails",
      ctaPrimary: { label: "Reservar turno", href: "__WHATSAPP__" },
      ctaSecondary: { label: "Ver servicios", href: "#servicios" },
      badges: [
        { icon: "sparkles", text: "Nail art personalizado" },
        { icon: "heart", text: "Productos de calidad" },
        { icon: "zap", text: "Turnos rápidos" },
      ],
    },
    services: {
      eyebrow: "Nuestros servicios",
      title: "Qué hacemos",
      subtitle: "Elegí el servicio y coordiná tu turno por WhatsApp.",
      items: [
        {
          title: "Semipermanente",
          short: "Color de larga duración, brillo uniforme.",
          long: "Esmaltado semipermanente con curado UV, terminación pareja y hasta 3 semanas de duración.",
          image: laser,
          imageAlt: "Esmaltado semipermanente",
        },
        {
          title: "Uñas esculpidas",
          short: "Extensión en gel o acrílico a tu medida.",
          long: "Esculpido en gel o acrílico, con la forma y largo que prefieras, base resistente para el día a día.",
          image: cavitacion,
          imageAlt: "Uñas esculpidas",
        },
        {
          title: "Nail art",
          short: "Diseños personalizados, de simples a XL.",
          long: "Diseños a mano alzada, stickers, piedras y texturas — desde looks minimalistas hasta producciones XL.",
          image: facial,
          imageAlt: "Nail art",
        },
      ],
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Antes de tu turno",
      subtitle: "Lo que más nos preguntan.",
      items: [
        {
          q: "¿Cuánto dura el semipermanente?",
          a: "Entre 2 y 3 semanas según el cuidado y el crecimiento natural de la uña.",
        },
        {
          q: "¿Puedo llevar un diseño de referencia?",
          a: "Sí, podés mandarnos una foto por WhatsApp y lo adaptamos a tu uña.",
        },
        {
          q: "¿Con cuánta anticipación reservo?",
          a: "Recomendamos reservar con 2-3 días de anticipación, sobre todo los fines de semana.",
        },
      ],
    },
    team: {
      eyebrow: "Equipo",
      title: "Quién te va a atender",
      members: [
        {
          name: "Noelia Cabrera",
          role: "Nail artist",
          quote: "Me encanta transformar ideas en diseños únicos para cada clienta.",
          initials: "NC",
        },
        {
          name: "Agustina Pais",
          role: "Técnica en esculpido",
          quote: "Cuido cada detalle para que la uña quede fuerte y prolija.",
          initials: "AP",
        },
      ],
    },
    results: {
      eyebrow: "Antes y después",
      title: "Trabajos realizados",
      subtitle: "Un vistazo a algunos de nuestros trabajos.",
      items: [
        { before: laser, after: laser, beforeAlt: "Antes", afterAlt: "Después" },
        { before: cavitacion, after: cavitacion, beforeAlt: "Antes", afterAlt: "Después" },
      ],
    },
    news: {
      eyebrow: "Novedades",
      title: "Últimas novedades",
      posts: [
        {
          title: "Nueva paleta de colores de temporada",
          date: "10 Jul 2026",
          image: facial,
          excerpt: "Sumamos una nueva línea de esmaltes semipermanentes para este invierno.",
        },
      ],
    },
    testimonials: {
      eyebrow: "Testimonios",
      title: "Lo que dicen nuestras clientas",
      items: [
        {
          name: "Rocío M.",
          initials: "RM",
          rating: 5,
          text: "Siempre salgo feliz, muy prolijas y puntuales.",
        },
        {
          name: "Ailén T.",
          initials: "AT",
          rating: 5,
          text: "El nail art quedó exactamente como lo pedí, recomendadísimas.",
        },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      title: "Reservá tu turno",
      subtitle: "Escribinos y coordinamos el horario.",
      cardTitle: "Escribinos por WhatsApp",
      cardSubtitle: "Contanos qué diseño tenés en mente.",
      ctaLabel: "Reservar por WhatsApp",
      followLabel: "Seguinos:",
    },
    footer: { ctaLabel: "Reservar turno" },
  },
};

export const tenants: Record<string, TenantRecord> = {
  bewoman,
  lunanails,
};

export const defaultTenantSlug = "bewoman";

export function getTenantBySlug(slug: string): TenantRecord | null {
  return tenants[slug] ?? null;
}

export function listTenants(): TenantRecord[] {
  return Object.values(tenants);
}
