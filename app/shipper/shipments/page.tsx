import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LOAD_STATUS_META } from "@/lib/status";
import type { LoadStatus } from "@/lib/generated/prisma/client";

const STATUS_FILTERS: { value: LoadStatus | "all"; label: string }[] = [
  { value: "all", label: "All active" },
  { value: "quote_requested", label: "Quote requested" },
  { value: "quoted", label: "Quoted" },
  { value: "booked", label: "Booked" },
  { value: "carrier_sourcing", label: "Sourcing carrier" },
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function ShipperShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status } = await searchParams;
  const statusFilter = status && status !== "all" ? (status as LoadStatus) : undefined;

  const loads = await db.load.findMany({
    where: {
      deletedAt: null,
      shipperCompanyId: user.companyId,
      ...(statusFilter ? { status: statusFilter } : { status: { notIn: ["closed", "cancelled"] } }),
    },
    include: { stops: { orderBy: { sequence: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const columns: DataTableColumn<(typeof loads)[number]>[] = [
    {
      key: "loadNumber",
      header: "Shipment #",
      render: (row) => (
        <Link href={`/shipper/shipments/${row.id}`} className="font-medium text-primary hover:underline">
          {row.loadNumber}
        </Link>
      ),
    },
    {
      key: "lane",
      header: "Lane",
      render: (row) => {
        const pickup = row.stops.find((s) => s.stopType === "pickup");
        const delivery = row.stops[row.stops.length - 1];
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
    { key: "mode", header: "Mode", render: (row) => row.mode.toUpperCase() },
    { key: "equipment", header: "Equipment", render: (row) => row.equipmentType.replace("_", " ") },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={LOAD_STATUS_META[row.status]} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shipments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every shipment you&apos;ve requested.</p>
        </div>
        <Button size="sm" render={<Link href="/shipper/shipments/new" />} nativeButton={false}>
          <Plus className="size-4" strokeWidth={1.75} />
          Request shipment
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "all") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value === "all" ? "/shipper/shipments" : `/shipper/shipments?status=${f.value}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={loads}
          emptyState={
            <EmptyState
              icon={Package}
              title="No shipments match this filter"
              description="Request a new shipment, or adjust the status filter above."
              action={
                <Button size="sm" render={<Link href="/shipper/shipments/new" />} nativeButton={false}>
                  Request shipment
                </Button>
              }
            />
          }
        />
      </div>
    </div>
  );
}
