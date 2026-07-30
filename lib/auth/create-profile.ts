import "server-only";
import { db } from "@/lib/db/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RoleName } from "@/lib/auth/roles";

/**
 * Creates the app-level `profiles` row for a just-created Supabase auth
 * user. Called by signup/invite server actions immediately after
 * `supabase.auth.admin.createUser()` / `supabase.auth.signUp()`, in the
 * same request — never by a database trigger, since company/role context
 * only exists in application code at signup time (see
 * context/04-application-architecture.md §2).
 *
 * Also stamps the role name onto the Supabase user's `app_metadata`, so
 * middleware.ts can read it straight from `supabase.auth.getUser()` without
 * touching Prisma — middleware runs on the Edge runtime by default, and
 * Prisma's `pg` driver adapter (raw TCP sockets) isn't Edge-compatible.
 */
export async function createProfileForUser(params: {
  userId: string;
  companyId: string;
  roleId: string;
  roleName: RoleName;
  fullName: string;
  phone?: string;
}) {
  const profile = await db.profile.create({
    data: {
      id: params.userId,
      companyId: params.companyId,
      roleId: params.roleId,
      fullName: params.fullName,
      phone: params.phone,
    },
  });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(params.userId, {
    app_metadata: { role: params.roleName },
  });

  if (error) {
    // Roll back the profile so we don't leave a row whose role middleware
    // can't see — the caller's flow should surface this as a signup failure.
    await db.profile.delete({ where: { id: profile.id } });
    throw new Error(`Failed to stamp role on auth user: ${error.message}`);
  }

  return profile;
}
