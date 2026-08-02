import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { COMPANY_STATUS_META, type StatusMeta } from "@/lib/status";
import { ApproveRejectActions } from "@/components/ops/approve-reject-actions";
import { approveCarrierCompany, rejectCarrierCompany } from "./actions";

/**
 * Insurance-expiry badge, separate from the generic status metas in
 * lib/status.ts since this is a date comparison, not a fixed enum — ties to
 * the compliance rule in context/01-business-workflow.md §4.7: an expired
 * carrier must be excluded from new load offers automatically. This page
 * just surfaces the signal; the actual dispatch-eligibility filter is
 * enforced separately at load-offer time (Phase 3 dispatch board / Phase 7
 * compliance cron), not here.
 */
function insuranceMeta(expiryDate: Date): StatusMeta {
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0) return { label: "Expired", tone: "red" };
  if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry}d`, tone: "amber" };
  return { label: "Current", tone: "green" };
}

export default async function OpsCarriersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "companies:read:all"))) redirect("/ops/dashboard");

  const carriers = await db.company.findMany({
    where: { type: "carrier" },
    include: { carrierProfile: true, _count: { select: { carrierAssignments: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const columns: DataTableColumn<(typeof carriers)[number]>[] = [
    {
      key: "name",
      header: "Company",
      render: (row) => (
        <div>
          <div className="font-medium">{row.dbaName ?? row.legalName}</div>
          {row.carrierProfile ? (
            <div className="text-xs text-muted-foreground">
              MC {row.carrierProfile.mcNumber} · DOT {row.carrierProfile.dotNumber}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={COMPANY_STATUS_META[row.status]} />,
    },
    {
      key: "authority",
      header: "Authority",
      render: (row) =>
        row.carrierProfile ? (
          <StatusBadge
            meta={{
              label: row.carrierProfile.authorityStatus,
              tone: row.carrierProfile.authorityStatus === "active" ? "green" : "red",
            }}
          />
        ) : (
          "—"
        ),
    },
    {
      key: "insurance",
      header: "Insurance",
      render: (row) => (row.carrierProfile ? <StatusBadge meta={insuranceMeta(row.carrierProfile.insuranceExpiryDate)} /> : "—"),
    },
    {
      key: "equipment",
      header: "Equipment",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.carrierProfile?.equipmentTypes.join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "loads",
      header: "Loads",
      className: "text-right",
      render: (row) => row._count.carrierAssignments,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) =>
        row.status === "pending" ? (
          <ApproveRejectActions
            companyId={row.id}
            approveAction={approveCarrierCompany}
            rejectAction={rejectCarrierCompany}
          />
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Carriers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Carrier directory, compliance status, and pending signup approvals.
      </p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={carriers}
          emptyState={
            <EmptyState
              icon={Truck}
              title="No carrier companies yet"
              description="Carrier signups from the marketing site will appear here for review."
            />
          }
        />
      </div>
    </div>
  );
}
