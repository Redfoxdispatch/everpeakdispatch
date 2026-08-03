import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LOAD_STATUS_META } from "@/lib/status";

export default async function CarrierMyLoadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const assignments = await db.carrierAssignment.findMany({
    where: { carrierCompanyId: user.companyId, status: "accepted" },
    include: {
      load: { include: { stops: { orderBy: { sequence: "asc" } } } },
      driver: true,
      vehicle: true,
    },
    orderBy: { respondedAt: "desc" },
  });

  const columns: DataTableColumn<(typeof assignments)[number]>[] = [
    {
      key: "loadNumber",
      header: "Load #",
      render: (row) => (
        <Link href={`/carrier/loads/${row.load.id}`} className="font-medium text-primary hover:underline">
          {row.load.loadNumber}
        </Link>
      ),
    },
    {
      key: "lane",
      header: "Lane",
      render: (row) => {
        const pickup = row.load.stops.find((s) => s.stopType === "pickup");
        const delivery = row.load.stops[row.load.stops.length - 1];
        const cityState = (s: typeof pickup) => {
          const addr = s?.address as { city?: string; state?: string } | null;
          return addr?.city && addr?.state ? `${addr.city}, ${addr.state}` : "—";
        };
        return (
          <span className="text-xs">
            {cityState(pickup)} → {cityState(delivery)}
          </span>
        );
      },
    },
    { key: "rate", header: "Rate", className: "text-right", render: (row) => `$${Number(row.carrierRate).toLocaleString()}` },
    { key: "driver", header: "Driver", render: (row) => row.driver?.fullName ?? "Unassigned" },
    { key: "vehicle", header: "Vehicle", render: (row) => row.vehicle?.plateNumber ?? "Unassigned" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={LOAD_STATUS_META[row.load.status]} />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">My Loads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Loads your company has accepted.</p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={assignments}
          emptyState={
            <EmptyState icon={Package} title="No active loads" description="Accepted offers from the Available Loads board will show up here." />
          }
        />
      </div>
    </div>
  );
}
