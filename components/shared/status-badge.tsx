import { cn } from "@/lib/utils";
import type { StatusMeta } from "@/lib/status";

const TONE_CLASSES: Record<StatusMeta["tone"], string> = {
  neutral: "bg-muted text-muted-foreground",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-400",
  red: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-400",
};

/** Single source of truth for status → color across every operational portal. */
export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
