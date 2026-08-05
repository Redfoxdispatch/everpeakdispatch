import "server-only";
import { db } from "@/lib/db/client";

/**
 * Fixed-window rate limiter backed by the `rate_limit_buckets` table — see
 * context/06-development-roadmap.md Phase 9. A single UPSERT does the
 * reset-on-expiry-or-increment logic atomically (Postgres's per-row UPSERT
 * lock makes this safe under concurrent requests for the same key, unlike a
 * read-then-write pair).
 */
export async function checkRateLimit(
  key: string,
  opts: { max: number; windowSeconds: number },
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const rows = await db.$queryRaw<{ count: number; window_start: Date }[]>`
    INSERT INTO rate_limit_buckets (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.window_start < now() - (${opts.windowSeconds}::text || ' seconds')::interval THEN 1
        ELSE rate_limit_buckets.count + 1
      END,
      window_start = CASE
        WHEN rate_limit_buckets.window_start < now() - (${opts.windowSeconds}::text || ' seconds')::interval THEN now()
        ELSE rate_limit_buckets.window_start
      END
    RETURNING count, window_start
  `;

  const row = rows[0];
  const allowed = row.count <= opts.max;
  const elapsedSeconds = Math.floor((Date.now() - new Date(row.window_start).getTime()) / 1000);
  return { allowed, retryAfterSeconds: allowed ? 0 : Math.max(1, opts.windowSeconds - elapsedSeconds) };
}

/**
 * The request's client IP, from the same header-precedence order already
 * used by lib/audit/log.ts — Vercel sets x-forwarded-for on every request.
 */
export async function clientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
}

export function rateLimitErrorMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
