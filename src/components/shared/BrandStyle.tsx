import { useTenant } from "@/lib/tenant-context";

/**
 * Injects the current tenant's brand palette as CSS custom properties at
 * runtime. Shared by the public landing (routes/sitio.$slug.tsx) and the
 * backoffice (routes/backoffice.tsx) — same mechanism, different tenant
 * source (slug in the URL vs. mocked "logged-in" session for now).
 */
export function BrandStyle() {
  const { site } = useTenant();
  const { primaryColor, secondaryColor, primaryForeground } = site.brand;
  const css = `:root {
  --brand-primary: ${primaryColor};
  --brand-secondary: ${secondaryColor};
  --primary: ${primaryColor};
  --primary-foreground: ${primaryForeground};
  --ring: ${primaryColor};
  --sidebar-primary: ${primaryColor};
  --sidebar-primary-foreground: ${primaryForeground};
  --sidebar-ring: ${primaryColor};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
