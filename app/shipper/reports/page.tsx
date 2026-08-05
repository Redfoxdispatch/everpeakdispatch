import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getShipperReport } from "@/lib/analytics/queries";
import { TrendBarChart } from "@/components/shared/trend-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function ShipperReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "analytics:read:own"))) redirect("/shipper/dashboard");

  const report = await getShipperReport(user.companyId, 6);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your shipment history and spend — trailing 6 months.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Total spend (6mo)" value={`$${report.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Tile label="Shipments booked" value={report.loadCount} />
        <Tile label="On-time delivery %" value={report.onTimePct == null ? "—" : `${report.onTimePct}%`} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Monthly spend</h2>
        <div className="mt-3">
          {report.loadCount === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No shipment history yet"
              description="Reports appear once you have booked shipments."
            />
          ) : (
            <TrendBarChart
              points={report.monthlySpend.map((p) => ({ label: p.label, value: p.amount }))}
              valueLabel="Spend by month"
              formatValue={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
