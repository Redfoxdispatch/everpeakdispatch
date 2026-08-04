import "server-only";
import type { NextRequest } from "next/server";

/**
 * Vercel Cron automatically sends `Authorization: Bearer ${CRON_SECRET}`
 * when the `CRON_SECRET` env var is set on the project — matching that name
 * exactly means these routes work with zero extra config on Vercel, and
 * still work with any other external scheduler that can set a header.
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
