import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { COMPANY_STATUS_META } from "@/lib/status";
import { ApproveRejectActions } from "@/components/ops/approve-reject-actions";
import { approveShipperCompany, rejectShipperCompany } from "./actions";

export default async function OpsShippersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "companies:read:all"))) redirect("/ops/dashboard");

  const shippers = await db.company.findMany({
    where: { type: "shipper" },
    include: { shipperProfile: true, _count: { select: { shipperLoads: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const columns: DataTableColumn<(typeof shippers)[number]>[] = [
    {
      key: "name",
      header: "Company",
      render: (row) => (
        <div>
          <div className="font-medium">{row.dbaName ?? row.legalName}</div>
          {row.shipperProfile?.industry ? (
            <div className="text-xs text-muted-foreground">{row.shipperProfile.industry}</div>
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
      key: "terms",
      header: "Terms",
      render: (row) =>
        row.shipperProfile ? `Net-${row.shipperProfile.paymentTermsDays}` : "—",
    },
    {
      key: "creditHold",
      header: "Credit hold",
      render: (row) => (row.shipperProfile?.creditHold ? <StatusBadge meta={{ label: "On hold", tone: "red" }} /> : "—"),
    },
    {
      key: "loads",
      header: "Loads",
      className: "text-right",
      render: (row) => row._count.shipperLoads,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) =>
        row.status === "pending" ? (
          <ApproveRejectActions
            companyId={row.id}
            approveAction={approveShipperCompany}
            rejectAction={rejectShipperCompany}
          />
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shippers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Shipper directory and pending signup approvals.
      </p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={shippers}
          emptyState={
            <EmptyState
              icon={Building2}
              title="No shipper companies yet"
              description="Shipper signups from the marketing site will appear here for review."
            />
          }
        />
      </div>
    </div>
  );
}
