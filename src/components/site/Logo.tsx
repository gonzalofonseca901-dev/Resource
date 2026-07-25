import { useSiteConfig } from "@/lib/tenant-context";

type Props = {
  variant?: "pink" | "white";
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({ variant = "pink", showTagline = true, size = "md" }: Props) {
  const { brand, business } = useSiteConfig();
  const src = variant === "white" ? brand.logo.white : brand.logo.pink;
  const iconSize = size === "sm" ? 28 : size === "lg" ? 56 : 40;
  const wordClass = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";
  const color = variant === "white" ? "text-white" : "text-primary";
  return (
    <div className="flex items-center gap-2">
      <img
        src={src}
        alt={brand.logo.alt}
        width={iconSize}
        height={iconSize}
        className="shrink-0"
        style={{ width: iconSize, height: iconSize }}
      />
      <div className="flex min-w-0 flex-col leading-none">
        <span className={`font-display font-extrabold lowercase ${wordClass} ${color}`}>
          {brand.logo.wordmark}
        </span>
        {showTagline && (
          <span
            className={`mt-0.5 text-[9px] uppercase ${
              variant === "white" ? "text-white/80" : "text-primary/70"
            }`}
            style={{ letterSpacing: "0.28em" }}
          >
            {business.tagline}
          </span>
        )}
      </div>
    </div>
  );
}
