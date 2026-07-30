const NAVY_LIGHT_FACET = "#173252"; // brand-navy-800
const NAVY_DARK_FACET = "#0A1A2E"; // brand-navy-950
const GOLD = "#C9963C"; // brand-gold-500
const WHITE_FACET_LIGHT = "#FFFFFF";
const WHITE_FACET_DARK = "#DCE6F0";

/**
 * Faceted peak mark — two navy facets (or white facets on the `light`
 * variant, for use on navy backgrounds) forming a mountain silhouette, gold
 * cap at the summit. See context/design.md §2.
 */
export function LogoMark({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const leftFacet = variant === "dark" ? NAVY_DARK_FACET : WHITE_FACET_DARK;
  const rightFacet = variant === "dark" ? NAVY_LIGHT_FACET : WHITE_FACET_LIGHT;

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 5 L4 34 L20 34 Z" fill={leftFacet} />
      <path d="M20 5 L20 34 L36 34 Z" fill={rightFacet} />
      <path d="M20 5 L14.5 15.5 L20 12.5 L25.5 15.5 Z" fill={GOLD} />
    </svg>
  );
}

export function Logo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const textColor = variant === "dark" ? "text-brand-ink" : "text-white";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark variant={variant} className="size-7 shrink-0" />
      <span className={`font-heading text-lg font-medium tracking-tight ${textColor}`}>
        BluePeakDispatch
      </span>
    </span>
  );
}
