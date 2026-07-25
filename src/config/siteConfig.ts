// Central site configuration. All client-specific content lives here so
// the same template can be reused across beauty/aesthetic centers.
// Replace these mock defaults with real values (e.g. from a DB) later.

// This file only defines the SHAPE of a business' content (SiteConfig type
// and its parts). The actual data per business lives in src/lib/tenants.ts
// now, since this template is shared by multiple clients (multi-tenant) —
// see TenantRecord there. Components read the resolved data via
// `useSiteConfig()` from "@/lib/tenant-context", never by importing a
// concrete object from here.

export type Service = {
  title: string;
  short: string;
  long: string;
  image: string;
  imageAlt: string;
};

export type TeamMember = {
  name: string;
  role: string;
  quote: string;
  initials: string;
};

export type Testimonial = {
  name: string;
  initials: string;
  text: string;
  rating: number;
};

export type Faq = { q: string; a: string };

export type NewsPost = {
  title: string;
  date: string;
  image: string;
  excerpt: string;
};

export type ResultItem = {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
};

export type NavLink = { href: string; label: string };

export type SiteConfig = {
  business: {
    id?: string; // UUID real en Supabase — solo presente cuando hay negocio real (no en tenants 100% mock)
    name: string;
    tagline: string;
    address: string;
    city: string;
    region: string;
    country: string;
    hours: string;
    phone: string;
    whatsappUrl: string;
    instagramUrl: string;
    facebookUrl: string;
    mapEmbedUrl: string;
    locale: string;
    copyrightSuffix: string;
  };
  brand: {
    primaryColor: string;
    primaryDark: string;
    primaryLight: string;
    secondaryColor: string;
    primaryForeground: string;
    logo: { pink: string; white: string; alt: string; wordmark: string };
  };
  seo: {
    title: string;
    description: string;
  };
  nav: {
    links: NavLink[];
    ctaLabel: string;
  };
  hero: {
    eyebrow: string;
    headlineLines: string[];
    subheadline: string;
    image: string;
    imageAlt: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
    badges: { icon: "zap" | "heart" | "sparkles"; text: string }[];
  };
  services: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Service[];
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Faq[];
  };
  team: {
    eyebrow: string;
    title: string;
    members: TeamMember[];
  };
  results: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: ResultItem[];
  };
  news: {
    eyebrow: string;
    title: string;
    posts: NewsPost[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Testimonial[];
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cardTitle: string;
    cardSubtitle: string;
    ctaLabel: string;
    followLabel: string;
  };
  footer: {
    ctaLabel: string;
  };
};
