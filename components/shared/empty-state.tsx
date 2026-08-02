import type { LucideIcon } from "lucide-react";

/** Consistent empty-state pattern — see context/05-ui-ux-planning.md: every
 * list view needs "an empty state that tells the user what to do next, not
 * just 'no data'." */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      {Icon ? <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} /> : null}
      <div>
        <p className="font-medium">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
