import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS and can call the Admin Auth
 * API (createUser, inviteUserByEmail, deleteUser). Server-only: never import
 * this from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the
 * browser. Used by signup/invite server actions that need to create an
 * auth.users row and then, in the same request, create the matching
 * `profiles` row via Prisma (see context/04-application-architecture.md §2).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
