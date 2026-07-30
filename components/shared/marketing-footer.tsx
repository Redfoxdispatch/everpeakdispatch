import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} BluePeakDispatch. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/services" className="hover:text-foreground">
            Services
          </Link>
          <Link href="/industries" className="hover:text-foreground">
            Industries
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
