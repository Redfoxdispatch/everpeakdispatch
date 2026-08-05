/**
 * Small inline-SVG bar chart for monthly trend series — no charting
 * dependency, since a handful of bars is all any Phase 8 report needs. Pure
 * presentation: the calling page supplies pre-aggregated points from
 * lib/analytics/queries.ts.
 */
export function TrendBarChart({
  points,
  valueLabel,
  formatValue = (v) => v.toLocaleString(),
}: {
  points: { label: string; value: number }[];
  valueLabel: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const hasNegative = points.some((p) => p.value < 0);

  return (
    <div>
      <div className="flex h-40 items-end gap-2">
        {points.map((p) => {
          const heightPct = (Math.abs(p.value) / max) * 100;
          return (
            <div key={p.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-medium tabular-nums text-foreground">{formatValue(p.value)}</span>
              <div className="flex w-full items-end justify-center" style={{ height: "100%" }}>
                <div
                  className={p.value < 0 ? "w-full rounded-t-sm bg-destructive/70" : "w-full rounded-t-sm bg-primary/80"}
                  style={{ height: `${Math.max(heightPct, p.value === 0 ? 0 : 2)}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{p.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {valueLabel}
        {hasNegative ? " (red = negative)" : ""}
      </p>
    </div>
  );
}
