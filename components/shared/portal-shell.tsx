import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/login/actions";
import { db } from "@/lib/db/client";
import type { CurrentUser } from "@/lib/auth/session";
import { NotificationBell, type NotificationRow } from "./notification-bell";

export type NavItem = {
  label: string;
  href: string;
};

export async function PortalShell({
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
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  const initialNotifications: NotificationRow[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

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
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b px-6 py-2.5">
          <NotificationBell userId={user.id} initialNotifications={initialNotifications} initialUnreadCount={unreadCount} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
