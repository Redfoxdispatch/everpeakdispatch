import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessPortal, homePathForRole } from "@/lib/auth/roles";
import { PortalShell, type NavItem } from "@/components/shared/portal-shell";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/ops/dashboard" },
  { label: "Loads", href: "/ops/loads" },
  { label: "Quotes", href: "/ops/quotes" },
  { label: "Carriers", href: "/ops/carriers" },
  { label: "Shippers", href: "/ops/shippers" },
  { label: "Dispatch", href: "/ops/dispatch" },
  { label: "Documents", href: "/ops/documents" },
  { label: "Invoices", href: "/ops/invoices" },
  { label: "Analytics", href: "/ops/analytics" },
];

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessPortal(user.role, "ops")) redirect(homePathForRole(user.role));

  const navItems = canAccessPortal(user.role, "admin")
    ? [...NAV_ITEMS, { label: "Admin", href: "/admin/dashboard" }]
    : NAV_ITEMS;

  return (
    <PortalShell portalName="Operations" navItems={navItems} user={user}>
      {children}
    </PortalShell>
  );
}
