import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Contact", href: "/contact" },
];

export function MarketingNav() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          BluePeakDispatch
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/shippers/signup" />} nativeButton={false}>
            Ship freight
          </Button>
          <Button
            variant="outline"
            size="sm"
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
