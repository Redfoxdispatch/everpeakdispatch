import { NextResponse, type NextRequest } from "next/server";
import { logError } from "@/lib/log";
import { checkRateLimit, clientIp } from "@/lib/rate-limit/check";

/**
 * Client-side error boundaries (app/error.tsx and the per-portal variants)
 * run in the browser, so a plain console.error there never reaches Vercel's
 * server function logs — this endpoint is how a caught client error still
 * ends up somewhere observable. Unauthenticated by necessity (a boundary can
 * fire before/without a session), so it's rate-limited like the other
 * public-facing endpoints from this phase, and the body is capped to a
 * small JSON shape rather than accepting arbitrary payloads.
 */
export async function POST(request: NextRequest) {
  const { allowed } = await checkRateLimit(`log-client-error:${await clientIp()}`, { max: 20, windowSeconds: 300 });
  if (!allowed) return NextResponse.json({ ok: false }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { context, message, stack, digest } = body as Record<string, unknown>;

  logError("client_error_boundary", new Error(typeof message === "string" ? message.slice(0, 2000) : "unknown client error"), {
    boundaryContext: typeof context === "string" ? context.slice(0, 200) : undefined,
    stack: typeof stack === "string" ? stack.slice(0, 4000) : undefined,
    digest: typeof digest === "string" ? digest.slice(0, 200) : undefined,
  });

  return NextResponse.json({ ok: true });
}
