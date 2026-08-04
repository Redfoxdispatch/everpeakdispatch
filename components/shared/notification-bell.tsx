"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications/actions";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * Realtime is additive UX on top of a correct cold-render — see
 * context/04-application-architecture.md §6: "every view must also work
 * correctly on a cold page load via normal server-rendered queries, so
 * Realtime failures degrade gracefully rather than breaking the page."
 * initialNotifications/initialUnreadCount come from a real server-rendered
 * query (PortalShell); the subscription below only layers live updates on
 * top of that already-correct state.
 */
export function NotificationBell({
  userId,
  initialNotifications,
  initialUnreadCount,
}: {
  userId: string;
  initialNotifications: NotificationRow[];
  initialUnreadCount: number;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // supabase-js only calls realtime.setAuth(token) reactively, from an
    // async onAuthStateChange listener — subscribing immediately here can
    // race ahead of that, so the channel joins with no auth token attached.
    // RLS then silently filters out every row for this connection (the
    // subscription still reports "subscribed", it just never delivers
    // anything). Explicitly setting auth before subscribing removes that race.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as {
              id: string;
              type: string;
              title: string;
              body: string | null;
              link: string | null;
              read_at: string | null;
              created_at: string;
            };
            setNotifications((prev) => [
              { id: row.id, type: row.type, title: row.title, body: row.body, link: row.link, readAt: row.read_at, createdAt: row.created_at },
              ...prev,
            ].slice(0, 20));
            setUnreadCount((c) => c + 1);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  async function handleOpen(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(id);
    setOpen(false);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="size-4" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 ? (
                <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              ) : null}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                <ul className="divide-y">
                  {notifications.map((n) => {
                    const unread = !n.readAt;
                    const content = (
                      <div className={`p-3 text-sm ${unread ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className={unread ? "font-medium" : ""}>{n.title}</span>
                          {unread ? <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" /> : null}
                        </div>
                        {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    );
                    return (
                      <li key={n.id}>
                        {n.link ? (
                          <Link href={n.link} onClick={() => handleOpen(n.id)} className="block hover:bg-muted/50">
                            {content}
                          </Link>
                        ) : (
                          <button type="button" onClick={() => handleOpen(n.id)} className="block w-full text-left hover:bg-muted/50">
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
