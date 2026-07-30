import Link from "next/link";
import { Logo } from "./logo";

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
    <footer className="border-t border-brand-navy-800 bg-brand-navy-950">
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
          © {new Date().getFullYear()} BluePeakDispatch. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
