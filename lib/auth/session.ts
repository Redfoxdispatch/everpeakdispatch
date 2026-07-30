import "server-only";
import { db } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server";
import type { RoleName } from "@/lib/auth/roles";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  fullName: string;
  status: "invited" | "active" | "suspended";
  role: RoleName;
  companyId: string;
  companyType: "internal" | "shipper" | "carrier";
  companyStatus: "pending" | "active" | "suspended" | "archived";
};

/**
 * Resolves the authenticated user AND their app-level profile fresh from
 * the database on every call — deliberately not cached across requests, so
 * a suspended user or changed role takes effect on their very next server
 * action even if their Supabase JWT hasn't refreshed yet (see
 * context/04-application-architecture.md §2).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const profile = await db.profile.findUnique({
    where: { id: authUser.id },
    include: { role: true, company: true },
  });

  // Auth user exists but the profile row hasn't been created yet (should be
  // momentary — profile creation happens server-side in the same request as
  // signup, see lib/auth/create-profile.ts) or the profile was deleted.
  if (!profile) return null;

  return {
    id: profile.id,
    email: authUser.email,
    fullName: profile.fullName,
    status: profile.status,
    role: profile.role.name as RoleName,
    companyId: profile.companyId,
    companyType: profile.company.type,
    companyStatus: profile.company.status,
  };
}
