import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessPortal, homePathForRole } from "@/lib/auth/roles";
import { PortalShell, type NavItem } from "@/components/shared/portal-shell";
import { PendingCompanyNotice } from "@/components/shared/pending-company-notice";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/carrier/dashboard" },
  { label: "Available Loads", href: "/carrier/loads/available" },
  { label: "My Loads", href: "/carrier/loads" },
  { label: "Documents", href: "/carrier/documents" },
  { label: "Payments", href: "/carrier/payments" },
  { label: "Vehicles", href: "/carrier/vehicles" },
  { label: "Drivers", href: "/carrier/drivers" },
  { label: "Reports", href: "/carrier/reports" },
];

export default async function CarrierLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessPortal(user.role, "carrier")) redirect(homePathForRole(user.role));
  if (user.companyStatus !== "active") return <PendingCompanyNotice companyStatus={user.companyStatus} />;

  return (
    <PortalShell portalName="Carrier Portal" navItems={NAV_ITEMS} user={user}>
      {children}
    </PortalShell>
  );
}
