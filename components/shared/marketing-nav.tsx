"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Contact", href: "/contact" },
];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group relative text-sm text-white/80 transition-colors hover:text-white">
      {children}
      <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-gold-400 transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </Link>
  );
}

export function MarketingNav() {
  const pathname = usePathname();
  // Transparent-over-hero only applies to the homepage's full-bleed dark
  // hero. Every other page gets the compact "island" treatment immediately
  // — pages without a matching full-bleed dark top section (e.g. Contact's
  // two-tone split) would otherwise show the transparent gradient smearing
  // across a light background. See context/design.md §9.
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useSafeReducedMotion();

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close the mobile panel on route change and prevent body scroll while open.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-500 ease-out ${
          scrolled ? "px-4 pt-3" : "px-0 pt-0"
        }`}
      >
        <motion.div
          className="relative flex w-full items-center justify-between overflow-hidden border"
          initial={false}
          animate={{
            maxWidth: scrolled ? 896 : 2560,
            borderRadius: scrolled ? 28 : 0,
            paddingLeft: scrolled ? 20 : 24,
            paddingRight: scrolled ? 20 : 24,
            paddingTop: scrolled ? 10 : 16,
            paddingBottom: scrolled ? 10 : 16,
            borderColor: scrolled ? "rgba(23,50,82,1)" : "rgba(23,50,82,0)",
            boxShadow: scrolled ? "0 8px 30px rgba(0,0,0,0.25)" : "0 0px 0px rgba(0,0,0,0)",
          }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Two background treatments cross-fade via opacity — a gradient
              can't smoothly animate into a solid color directly (different
              background-image value types), so both layers stay mounted and
              only their opacity transitions. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-navy-950/70 to-transparent"
            initial={false}
            animate={{ opacity: scrolled ? 0 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-brand-navy-950/90 backdrop-blur-md"
            initial={false}
            animate={{ opacity: scrolled ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeInOut" }}
          />

          <Link href="/" className="relative z-10">
            <Logo variant="light" />
          </Link>
          <nav className="relative z-10 hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="relative z-10 hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Sign in
            </Button>
            {!scrolled ? (
              <>
                <Button size="sm" render={<Link href="/shippers/signup" />} nativeButton={false}>
                  Ship freight
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  render={<Link href="/carriers/signup" />}
                  nativeButton={false}
                >
                  Haul freight
                </Button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="relative z-10 -mr-1.5 flex size-9 items-center justify-center text-white md:hidden"
          >
            <Menu className="size-5" strokeWidth={1.75} />
          </button>
        </motion.div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              className="fixed inset-0 z-60 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              key="mobile-nav-panel"
              className="fixed inset-y-0 right-0 z-70 flex w-full max-w-xs flex-col bg-brand-navy-950 p-6 md:hidden"
              initial={{ x: reduceMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduceMotion ? 0 : "100%" }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div className="flex items-center justify-between">
                <Logo variant="light" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="flex size-9 items-center justify-center text-white"
                >
                  <X className="size-5" strokeWidth={1.75} />
                </button>
              </div>
              <nav className="mt-10 flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="border-b border-brand-navy-800 py-4 text-lg text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 pt-8">
                <Button
                  variant="ghost"
                  className="justify-center text-white hover:bg-white/10 hover:text-white"
                  render={<Link href="/login" />}
                  nativeButton={false}
                >
                  Sign in
                </Button>
                <Button render={<Link href="/shippers/signup" />} nativeButton={false}>
                  Ship freight
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  render={<Link href="/carriers/signup" />}
                  nativeButton={false}
                >
                  Haul freight
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
