import "server-only";
import { db } from "@/lib/db/client";
import type { RoleName } from "@/lib/auth/roles";

/**
 * In-app notification creation — see context/01-business-workflow.md §5 for
 * the full trigger list and context/06-development-roadmap.md Phase 7. Email
 * delivery (the `channel` field also supports "email"/"sms") is explicitly
 * deferred to a later phase; every call here writes `channel: "in_app"`
 * only. Mirrors the writeAuditLog pattern (lib/audit/log.ts) — one place
 * every "notify X" call goes through, so the shape stays consistent.
 *
 * Fan-out helpers deliberately use individual `create()` calls in a
 * Promise.all rather than a single `createMany()` — confirmed via a live
 * WebSocket trace that this Supabase project's Realtime "postgres_changes"
 * feature does not fire for the multi-row INSERT a createMany produces
 * (the row lands in the DB correctly, but no event reaches subscribers), so
 * a createMany fan-out would silently never appear live, only on next cold
 * load. Individual creates deliver the row exactly the same but keep
 * Realtime working.
 */
type NotifyInput = {
  type: string;
  title: string;
  body?: string;
  link?: string;
};

export async function notifyUser(userId: string, input: NotifyInput): Promise<void> {
  await db.notification.create({
    data: { userId, type: input.type, title: input.title, body: input.body ?? null, link: input.link ?? null, channel: "in_app" },
  });
}

/** Fans out to every active user at a company — a shipper/carrier company may have more than one portal user. */
export async function notifyCompany(companyId: string, input: NotifyInput): Promise<void> {
  const profiles = await db.profile.findMany({ where: { companyId, status: "active" }, select: { id: true } });
  await Promise.all(profiles.map((p) => notifyUser(p.id, input)));
}

/**
 * Fans out to every active internal user holding one of the given roles —
 * used where a trigger isn't tied to one specific broker (e.g. a carrier's
 * insurance expiring isn't "owned" by any single load/broker the way a
 * quote or offer is).
 */
export async function notifyRoles(roles: RoleName[], input: NotifyInput): Promise<void> {
  const profiles = await db.profile.findMany({
    where: { status: "active", role: { name: { in: roles } } },
    select: { id: true },
  });
  await Promise.all(profiles.map((p) => notifyUser(p.id, input)));
}
