import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { canAccessPortal, homePathForRole, type PortalSegment, type RoleName } from "@/lib/auth/roles";

const PORTAL_SEGMENTS: PortalSegment[] = ["shipper", "carrier", "ops", "admin"];
const PUBLIC_AUTH_PATHS = ["/login", "/register", "/reset-password"];

/**
 * Routing only — cheap and Edge-compatible. Reads the role Supabase already
 * revalidated via `getUser()` in updateSession(); does NOT touch Prisma
 * (middleware runs on the Edge runtime by default, and Prisma's `pg` driver
 * adapter needs Node's `net`/`tls`, which Edge doesn't have). Real
 * authorization for every mutation still re-checks the `profiles` row fresh
 * via Prisma in the server action itself — see
 * context/04-application-architecture.md §2-3.
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const firstSegment = path.split("/")[1];
  const isPortalPath = PORTAL_SEGMENTS.includes(firstSegment as PortalSegment);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));

  if (!user) {
    if (isPortalPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  const role = user.app_metadata?.role as RoleName | undefined;

  // Authenticated but no role stamped yet (profile-creation step failed
  // partway, or a raw auth user with no portal access) — treat as logged
  // out of any portal rather than crashing on an undefined role.
  if (!role) {
    if (isPortalPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  if (isPublicAuthPath) {
    return NextResponse.redirect(new URL(homePathForRole(role), request.url));
  }

  if (isPortalPath && !canAccessPortal(role, firstSegment as PortalSegment)) {
    return NextResponse.redirect(new URL(homePathForRole(role), request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization,
     * so the Supabase session cookie still refreshes on every navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
