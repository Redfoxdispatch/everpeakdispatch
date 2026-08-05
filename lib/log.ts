import "server-only";

/**
 * Structured server-side logging — see context/06-development-roadmap.md
 * Phase 9. The user chose Vercel's built-in function-log observability over
 * a third-party service (Sentry etc.), so the job here is just to make sure
 * every log line is a single-line JSON object Vercel's log viewer can filter
 * on (level/context), not a bare stack trace — not to ship a new service.
 */
type LogLevel = "error" | "warn" | "info";

function write(level: LogLevel, context: string, meta?: Record<string, unknown>) {
  const line = { level, context, timestamp: new Date().toISOString(), ...meta };
  const out = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  out(JSON.stringify(line));
}

function serializeError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, name: error.name };
  }
  return { message: String(error) };
}

export function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
  write("error", context, { ...meta, error: serializeError(error) });
}

export function logWarn(context: string, meta?: Record<string, unknown>) {
  write("warn", context, meta);
}

export function logInfo(context: string, meta?: Record<string, unknown>) {
  write("info", context, meta);
}
