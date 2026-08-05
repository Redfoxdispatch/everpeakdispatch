"use client";

/**
 * Fire-and-forget report to app/api/log-client-error — a client component
 * (error.tsx) can't write to a server log directly, so this is how a caught
 * render error still shows up in Vercel's function logs. Never throws: a
 * failure to report shouldn't compound the original error.
 */
export function reportClientError(context: string, error: Error & { digest?: string }) {
  fetch("/api/log-client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, message: error.message, stack: error.stack, digest: error.digest }),
  }).catch(() => {});
}
