import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/login/actions";
import type { CurrentUser } from "@/lib/auth/session";

export type NavItem = {
  label: string;
  href: string;
};

export function PortalShell({
  portalName,
  navItems,
  user,
  children,
}: {
  portalName: string;
  navItems: NavItem[];
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20 p-4">
        <div className="mb-6 px-2 text-lg font-semibold">{portalName}</div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t pt-4">
          <div className="px-2 text-sm">
            <div className="font-medium">{user.fullName}</div>
            <div className="truncate text-muted-foreground">{user.email}</div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
