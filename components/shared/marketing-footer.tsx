import Link from "next/link";
import { Logo } from "./logo";
import { Marquee } from "./marquee";

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Industries", href: "/industries" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Ship freight", href: "/shippers/signup" },
      { label: "Haul freight", href: "/carriers/signup" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-brand-navy-800 bg-brand-navy-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              A full-service freight brokerage connecting shippers with vetted carriers across
              full truckload, LTL, and specialized equipment.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="text-xs font-medium tracking-wide text-white/50 uppercase">
                {col.heading}
              </div>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-brand-gold-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 border-t border-brand-navy-800 pt-8 text-sm text-white/40">
          © {new Date().getFullYear()} EverPeakDispatch. All rights reserved.
        </div>
      </div>

      {/* Slanted infinite marquees — two opposing angles, brand navy/gold.
          The bars rotate in opposite directions, so they diverge at one
          edge and converge at the other; the second bar is pulled up into
          a deliberate overlap so even the diverging edge stays gap-free. */}
      <div className="py-10 sm:py-14">
        <Marquee
          text="Freight moved right"
          angle={-2.5}
          className="bg-brand-gold-500 py-3 text-brand-navy-950 sm:py-5"
        />
        <div className="-mt-16 sm:-mt-20">
          <Marquee
            text="Ship freight · Haul freight"
            angle={2}
            durationSeconds={32}
            className="bg-brand-navy-800 py-3 text-white sm:py-5"
          />
        </div>
      </div>

      {/* Huge wordmark, ~70% visible — the bottom 30% is pushed past the
          footer's edge via translate-y, clipped by this div's own
          overflow-hidden. Font size is capped conservatively (not scaled
          purely by vw) so the word never grows wide enough to overflow
          horizontally too. */}
      <div className="overflow-hidden" aria-hidden="true">
        <div className="translate-y-[30%] text-center font-heading text-[clamp(2.5rem,11vw,12rem)] leading-none font-bold whitespace-nowrap text-brand-navy-800/50 select-none">
          EverPeakDispatch
        </div>
      </div>
    </footer>
  );
}
