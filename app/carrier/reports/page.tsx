import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getCarrierReport } from "@/lib/analytics/queries";
import { TrendBarChart } from "@/components/shared/trend-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";

function Tile({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className={`text-2xl font-semibold ${valueClassName ?? ""}`}>{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function CarrierReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "analytics:read:own"))) redirect("/carrier/dashboard");

  const report = await getCarrierReport(user.companyId, 6);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your earnings and performance — trailing 6 months.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Tile
          label="Total earnings (6mo)"
          value={`$${report.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <Tile label="Loads completed" value={report.loadCount} />
        <Tile label="On-time delivery %" value={report.onTimePct == null ? "—" : `${report.onTimePct}%`} />
        <Tile
          label="Fall-off rate"
          value={report.fallOffRatePct == null ? "—" : `${report.fallOffRatePct}%`}
          valueClassName={report.fallOffRatePct != null && report.fallOffRatePct > 20 ? "text-destructive" : undefined}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Monthly earnings</h2>
        <div className="mt-3">
          {report.loadCount === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No completed loads yet"
              description="Reports appear once you have accepted and completed loads."
            />
          ) : (
            <TrendBarChart
              points={report.monthlyEarnings.map((p) => ({ label: p.label, value: p.amount }))}
              valueLabel="Monthly earnings"
              formatValue={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
