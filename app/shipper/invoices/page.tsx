import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { INVOICE_STATUS_META } from "@/lib/status";

export default async function ShipperInvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const invoices = await db.invoice.findMany({
    where: { type: "shipper_invoice", companyId: user.companyId },
    include: { load: { select: { id: true, loadNumber: true } } },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  const columns: DataTableColumn<(typeof invoices)[number]>[] = [
    {
      key: "number",
      header: "Invoice #",
      render: (row) => (
        <Link href={`/shipper/shipments/${row.load.id}`} className="font-medium text-primary hover:underline">
          {row.invoiceNumber}
        </Link>
      ),
    },
    { key: "load", header: "Shipment", render: (row) => row.load.loadNumber },
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
    { key: "dueDate", header: "Due", render: (row) => row.dueDate.toLocaleDateString() },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={INVOICE_STATUS_META[row.status]} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <Link href={`/shipper/shipments/${row.load.id}`} className="text-xs font-medium text-primary hover:underline">
          View / pay
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every invoice issued to your company.</p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={invoices}
          emptyState={
            <EmptyState icon={Receipt} title="No invoices yet" description="Invoices are issued once a shipment is completed." />
          }
        />
      </div>
    </div>
  );
}
