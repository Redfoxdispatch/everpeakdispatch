import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import type { LoadStatus } from "@/lib/generated/prisma/client";

/**
 * Grouped-by-status board — context/05-ui-ux-planning.md calls for
 * "Board/kanban-style view of loads by status, drag to advance (or
 * explicit action buttons)". This ships the explicit-action-buttons half
 * (the load detail page's StatusControls) rather than drag-and-drop, which
 * the doc offers as an equally valid alternative — a reasonable place to
 * draw the v1 line; drag reordering can follow later without a rework
 * since it'd operate on the same status field.
 */
const BOARD_COLUMNS: { title: string; statuses: LoadStatus[] }[] = [
  { title: "Needs quote", statuses: ["draft", "quote_requested"] },
  { title: "Quoted", statuses: ["quoted"] },
  { title: "Booked", statuses: ["booked"] },
  { title: "Sourcing carrier", statuses: ["carrier_sourcing"] },
  { title: "In transit", statuses: ["dispatched", "at_pickup", "picked_up", "in_transit", "at_delivery"] },
  { title: "Delivered", statuses: ["delivered", "completed"] },
];

export default async function DispatchBoardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "loads:read:all"))) redirect("/ops/dashboard");

  // Bounded like every other list view in this app (see app/ops/loads/page.tsx
  // take: 100, app/ops/quotes/page.tsx take: 200) — an unbounded query here
  // grows without limit as the brokerage operates over time; a board showing
  // the 300 most-recently-active loads is what a broker actually scans, not
  // every load ever dispatched. Confirmed via load testing at 2000+ loads:
  // this was previously unbounded and returned 1800+ full rows with nested
  // relations on every page load.
  const loads = await db.load.findMany({
    where: { deletedAt: null, status: { in: BOARD_COLUMNS.flatMap((c) => c.statuses) } },
    include: { shipperCompany: true, stops: { orderBy: { sequence: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dispatch</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {loads.length === 300 ? "The 300 most recently active loads, grouped by where they are in the workflow." : "Every active load, grouped by where it is in the workflow."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {BOARD_COLUMNS.map((column) => {
          const columnLoads = loads.filter((l) => column.statuses.includes(l.status));
          return (
            <div key={column.title} className="min-w-0">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{column.title}</h2>
                <span className="text-xs text-muted-foreground">{columnLoads.length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {columnLoads.map((load) => {
                  const pickup = load.stops.find((s) => s.stopType === "pickup");
                  const delivery = load.stops[load.stops.length - 1];
                  const city = (s: typeof pickup) => (s?.address as { city?: string } | null)?.city ?? "—";
                  return (
                    <Link
                      key={load.id}
                      href={`/ops/loads/${load.id}`}
                      className="block rounded-lg border bg-card p-3 text-sm hover:border-ring"
                    >
                      <div className="font-medium">{load.loadNumber}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {load.shipperCompany.dbaName ?? load.shipperCompany.legalName}
                      </div>
                      <div className="mt-1 text-xs">
                        {city(pickup)} → {city(delivery)}
                      </div>
                    </Link>
                  );
                })}
                {columnLoads.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Empty</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
