import "server-only";
import { db } from "@/lib/db/client";
import type { CurrentUser } from "@/lib/auth/session";
import type { PermissionKey } from "./constants";

export class PermissionError extends Error {
  constructor(key: string) {
    super(`Missing permission: ${key}`);
    this.name = "PermissionError";
  }
}

/**
 * Role → permission check only — see context/02-rbac-roles-permissions.md
 * §1: "a permission check is always (role, company_type, ownership), never
 * role alone." This function answers the role half only; `:own`-scoped
 * permissions still need an explicit ownership check, which
 * `assertPermission` below folds in via its third argument.
 */
export async function can(user: CurrentUser, key: PermissionKey): Promise<boolean> {
  const [resource, action, scope] = key.split(":") as [string, string, string?];
  const match = await db.rolePermission.findFirst({
    where: {
      role: { name: user.role },
      permission: { resource, action, scope: scope ?? null },
    },
  });
  return match !== null;
}

/**
 * Throws unless the actor's role has `key` AND, for `:own`-scoped keys, the
 * target record belongs to the actor's own company. Every server action
 * that mutates or reads scoped data calls this before touching Prisma — see
 * context/04-application-architecture.md §4 for the canonical server-action
 * shape this slots into.
 *
 * `ownerCompanyId` is required for any `:own`-scoped key and deliberately
 * has no default — a caller that forgets to pass it for an `:own` key gets
 * a thrown PermissionError (fail closed) rather than an accidental
 * role-only check that would let e.g. any shipper_user read every load.
 */
export async function assertPermission(
  user: CurrentUser,
  key: PermissionKey,
  ownerCompanyId?: string | null,
): Promise<void> {
  if (!(await can(user, key))) {
    throw new PermissionError(key);
  }

  const scope = key.split(":")[2];
  if (scope === "own") {
    if (ownerCompanyId == null || ownerCompanyId !== user.companyId) {
      throw new PermissionError(key);
    }
  }
}
