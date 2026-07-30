import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessPortal, homePathForRole } from "@/lib/auth/roles";
import { PortalShell, type NavItem } from "@/components/shared/portal-shell";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Roles", href: "/admin/roles" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Audit Logs", href: "/admin/audit-logs" },
  { label: "Back to Ops", href: "/ops/dashboard" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessPortal(user.role, "admin")) redirect(homePathForRole(user.role));

  return (
    <PortalShell portalName="Admin" navItems={NAV_ITEMS} user={user}>
      {children}
    </PortalShell>
  );
}
