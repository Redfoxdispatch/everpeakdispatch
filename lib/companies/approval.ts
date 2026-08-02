import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { CompanyType } from "@/lib/generated/prisma/client";

export type ApprovalResult = { error?: string };

/**
 * Shared by app/ops/shippers/actions.ts and app/ops/carriers/actions.ts —
 * activates a `pending` company created by the Phase 2 signup forms (see
 * context/05-ui-ux-planning.md "MVP note" and
 * context/06-development-roadmap.md Phase 3 "Company approval workflow").
 * `companies:manage` is brokerage_admin/super_admin only — broker has
 * `companies:read:all` but not `:manage`, matching
 * context/02-rbac-roles-permissions.md §3 (broker gets "R all, U notes",
 * not full CRUD).
 */
export async function approveCompany(
  user: CurrentUser,
  companyId: string,
  type: CompanyType,
  revalidatePathTarget: string,
): Promise<ApprovalResult> {
  await assertPermission(user, "companies:manage");

  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company || company.type !== type) {
    return { error: `${type === "shipper" ? "Shipper" : "Carrier"} company not found.` };
  }
  if (company.status !== "pending") {
    return { error: "This company is not pending review." };
  }

  await db.company.update({ where: { id: companyId }, data: { status: "active" } });
  await writeAuditLog({
    actorUserId: user.id,
    action: "company.approved",
    entityType: "companies",
    entityId: companyId,
    before: { status: "pending" },
    after: { status: "active" },
  });

  revalidatePath(revalidatePathTarget);
  return {};
}

export async function rejectCompany(
  user: CurrentUser,
  companyId: string,
  type: CompanyType,
  reason: string,
  revalidatePathTarget: string,
): Promise<ApprovalResult> {
  await assertPermission(user, "companies:manage");

  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company || company.type !== type) {
    return { error: `${type === "shipper" ? "Shipper" : "Carrier"} company not found.` };
  }
  if (company.status !== "pending") {
    return { error: "This company is not pending review." };
  }

  // No dedicated rejection-reason column on `companies` (see
  // context/03-database-schema.md §3) — captured in the audit log instead,
  // consistent with how the schema treats audit_logs as the durable record
  // for context that doesn't warrant its own column.
  await db.company.update({ where: { id: companyId }, data: { status: "archived" } });
  await writeAuditLog({
    actorUserId: user.id,
    action: "company.rejected",
    entityType: "companies",
    entityId: companyId,
    before: { status: "pending" },
    after: { status: "archived", reason: reason || null },
  });

  revalidatePath(revalidatePathTarget);
  return {};
}
