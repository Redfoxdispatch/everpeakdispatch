import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessPortal, homePathForRole } from "@/lib/auth/roles";
import { PortalShell, type NavItem } from "@/components/shared/portal-shell";
import { PendingCompanyNotice } from "@/components/shared/pending-company-notice";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/shipper/dashboard" },
  { label: "Create Shipment", href: "/shipper/shipments/new" },
  { label: "Quotes", href: "/shipper/quotes" },
  { label: "Active Shipments", href: "/shipper/shipments" },
  { label: "Documents", href: "/shipper/documents" },
  { label: "Invoices", href: "/shipper/invoices" },
  { label: "Reports", href: "/shipper/reports" },
  { label: "Profile", href: "/shipper/profile" },
];

export default async function ShipperLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessPortal(user.role, "shipper")) redirect(homePathForRole(user.role));
  if (user.companyStatus !== "active") return <PendingCompanyNotice companyStatus={user.companyStatus} />;

  return (
    <PortalShell portalName="Shipper Portal" navItems={NAV_ITEMS} user={user}>
      {children}
    </PortalShell>
  );
}
