import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Writes an audit_logs row for a state-changing action. Every feature that
 * mutates data ships with a call to this — see AGENTS.md "Every feature
 * ships with... an audit log entry for state-changing actions."
 *
 * actorUserId is nullable to cover actions with no authenticated actor yet
 * (e.g. a public shipper/carrier signup creates its own profile as part of
 * the same action — pass the newly created profile's id as the actor).
 */
export async function writeAuditLog(params: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}) {
  const headerList = await headers();
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || null;

  await db.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      ipAddress: ipAddress ?? undefined,
    },
  });
}
