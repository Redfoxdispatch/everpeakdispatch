import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  /** Plain text or, for a sortable column, a pre-built link the page composes itself (keeps this component routing-agnostic). */
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
};

/**
 * Dense, compact-row data table for operational portals — see
 * context/05-ui-ux-planning.md: "information-dense, compact-row data tables
 * in the operational portals... do not apply marketing-site spaciousness to
 * a load list with 200 rows." Filtering/sorting/pagination live in the
 * calling page's server-side query (URL search params), not in this
 * component — it's purely presentational so it works as a Server Component.
 */
export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyState?: React.ReactNode;
}) {
  if (data.length === 0) {
    return emptyState ?? null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-4 py-2.5 font-medium", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-2.5", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
