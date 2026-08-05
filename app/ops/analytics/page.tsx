import { redirect } from "next/navigation";
import { Building2, Route, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendBarChart } from "@/components/shared/trend-bar-chart";
import {
  getMarginTrend,
  getRevenueByShipper,
  getRevenueByLane,
  getOnTimeStats,
  getCarrierPerformanceRows,
  type ShipperRevenueRow,
  type LaneRevenueRow,
  type CarrierPerformanceRow,
} from "@/lib/analytics/queries";

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function OpsAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "analytics:read:all"))) redirect("/ops/dashboard");

  const [marginTrend, revenueByShipper, revenueByLane, onTimeStats, carrierPerformance] = await Promise.all([
    getMarginTrend(6),
    getRevenueByShipper(6),
    getRevenueByLane(6),
    getOnTimeStats(),
    getCarrierPerformanceRows(),
  ]);

  const totalRevenue = marginTrend.reduce((sum, p) => sum + p.revenue, 0);
  const totalMargin = marginTrend.reduce((sum, p) => sum + p.margin, 0);
  const marginPct = totalRevenue !== 0 ? Math.round((totalMargin / totalRevenue) * 1000) / 10 : null;

  const shipperRows: (ShipperRevenueRow & { id: string })[] = revenueByShipper.map((r) => ({ ...r, id: r.shipperCompanyId }));
  const laneRowsAll: (LaneRevenueRow & { id: string })[] = revenueByLane.map((r) => ({ ...r, id: r.lane }));
  const laneRows = laneRowsAll.slice(0, 10);
  const carrierRows: (CarrierPerformanceRow & { id: string })[] = carrierPerformance.map((r) => ({ ...r, id: r.carrierCompanyId }));

  const shipperColumns: DataTableColumn<(typeof shipperRows)[number]>[] = [
    { key: "shipper", header: "Shipper", render: (row) => row.shipperName },
    { key: "loads", header: "Loads", className: "text-right", render: (row) => row.loadCount },
    { key: "revenue", header: "Revenue", className: "text-right", render: (row) => formatMoney(row.revenue) },
  ];

  const laneColumns: DataTableColumn<(typeof laneRows)[number]>[] = [
    { key: "lane", header: "Lane", render: (row) => row.lane },
    { key: "loads", header: "Loads", className: "text-right", render: (row) => row.loadCount },
    { key: "revenue", header: "Revenue", className: "text-right", render: (row) => formatMoney(row.revenue) },
  ];

  const carrierColumns: DataTableColumn<(typeof carrierRows)[number]>[] = [
    { key: "carrier", header: "Carrier", render: (row) => row.carrierName },
    { key: "completed", header: "Completed deliveries", className: "text-right", render: (row) => row.completedDeliveries },
    { key: "onTime", header: "On-time %", className: "text-right", render: (row) => formatPct(row.onTimePct) },
    {
      key: "fallOff",
      header: "Fall-off %",
      className: "text-right",
      render: (row) => (
        <span className={row.fallOffRatePct !== null && row.fallOffRatePct > 20 ? "text-destructive" : undefined}>
          {formatPct(row.fallOffRatePct)}
        </span>
      ),
    },
    { key: "accepted", header: "Accepted", className: "text-right", render: (row) => row.accepted },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Brokerage-wide performance over the trailing 6 months, computed from booked loads.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Total revenue" value={formatMoney(totalRevenue)} />
        <KpiTile label="Total margin" value={formatMoney(totalMargin)} />
        <KpiTile label="Margin %" value={formatPct(marginPct)} />
        <KpiTile label="Brokerage on-time %" value={formatPct(onTimeStats.onTimePct)} />
      </div>

      <div className="mt-8 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Revenue by month</h2>
        <div className="mt-4">
          <TrendBarChart
            points={marginTrend.map((p) => ({ label: p.label, value: p.revenue }))}
            valueLabel="Revenue"
            formatValue={formatMoney}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Margin by month</h2>
        <div className="mt-4">
          <TrendBarChart
            points={marginTrend.map((p) => ({ label: p.label, value: p.margin }))}
            valueLabel="Margin"
            formatValue={formatMoney}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Revenue by shipper</h2>
        <div className="mt-4">
          <DataTable
            columns={shipperColumns}
            data={shipperRows}
            emptyState={
              <EmptyState
                icon={Building2}
                title="No booked loads yet"
                description="Revenue by shipper appears here once shipper loads are booked."
              />
            }
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Revenue by lane</h2>
        <div className="mt-4">
          <DataTable
            columns={laneColumns}
            data={laneRows}
            emptyState={
              <EmptyState
                icon={Route}
                title="No booked loads yet"
                description="Revenue by lane appears here once loads are booked."
              />
            }
          />
          {laneRowsAll.length > 10 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing top 10 of {laneRowsAll.length} lanes
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Carrier performance</h2>
        <div className="mt-4">
          <DataTable
            columns={carrierColumns}
            data={carrierRows}
            emptyState={
              <EmptyState
                icon={Truck}
                title="No carrier activity yet"
                description="Carrier performance appears here once carriers have been offered loads."
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
