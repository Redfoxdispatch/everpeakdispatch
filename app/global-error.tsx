"use client";

import { ErrorFallback } from "@/components/shared/error-fallback";

/**
 * Catches errors in the root layout itself (which app/error.tsx cannot —
 * Next.js requires global-error.tsx to render its own <html>/<body> since it
 * replaces the root layout entirely). Rare in practice; kept minimal.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <ErrorFallback error={error} reset={reset} context="global" />
      </body>
    </html>
  );
}
