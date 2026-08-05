"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/report-client-error";

/**
 * Shared fallback UI for every error.tsx boundary in the app — see
 * context/06-development-roadmap.md Phase 9. Reports to
 * app/api/log-client-error on mount so a caught render error is still
 * visible in Vercel's function logs, not just the user's browser console.
 */
export function ErrorFallback({
  error,
  reset,
  context,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  context: string;
}) {
  useEffect(() => {
    reportClientError(context, error);
  }, [error, context]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Try again, or contact support if it keeps happening.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
