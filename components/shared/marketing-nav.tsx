"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-brand-navy-800 bg-brand-navy-950"
          : "border-transparent bg-linear-to-b from-brand-navy-950/70 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo variant="light" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Sign in
          </Button>
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
        </div>
      </div>
    </header>
  );
}
