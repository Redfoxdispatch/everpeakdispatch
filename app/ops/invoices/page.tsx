import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { INVOICE_STATUS_META } from "@/lib/status";

export default async function OpsInvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "invoices:issue"))) redirect("/ops/dashboard");

  const invoices = await db.invoice.findMany({
    include: { company: true, load: { select: { loadNumber: true } } },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  const columns: DataTableColumn<(typeof invoices)[number]>[] = [
    {
      key: "number",
      header: "Invoice #",
      render: (row) => (
        <Link href={`/ops/loads/${row.loadId}`} className="font-medium text-primary hover:underline">
          {row.invoiceNumber}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => (row.type === "shipper_invoice" ? "Shipper invoice" : "Carrier settlement"),
    },
    {
      key: "company",
      header: "Company",
      render: (row) => row.company.dbaName ?? row.company.legalName,
    },
    {
      key: "load",
      header: "Load",
      render: (row) => row.load.loadNumber,
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (row) => (
        <div className="text-right">
          <div>${Number(row.totalAmount).toLocaleString()}</div>
          {Number(row.amountPaid) > 0 && row.status !== "paid" ? (
            <div className="text-xs text-muted-foreground">${Number(row.amountPaid).toLocaleString()} paid</div>
          ) : null}
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due",
      render: (row) => new Date(row.dueDate).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={INVOICE_STATUS_META[row.status]} />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <p className="mt-1 text-sm text-muted-foreground">Shipper invoices and carrier settlements, across every load.</p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={invoices}
          emptyState={
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Invoices and settlements are issued from a completed load's detail page."
            />
          }
        />
      </div>
    </div>
  );
}
