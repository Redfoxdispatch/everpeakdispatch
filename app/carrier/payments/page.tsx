import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { INVOICE_STATUS_META } from "@/lib/status";

export default async function CarrierPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const settlements = await db.invoice.findMany({
    where: { type: "carrier_settlement", companyId: user.companyId },
    include: { load: { select: { id: true, loadNumber: true } } },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });

  const columns: DataTableColumn<(typeof settlements)[number]>[] = [
    {
      key: "number",
      header: "Settlement #",
      render: (row) => (
        <Link href={`/carrier/loads/${row.load.id}`} className="font-medium text-primary hover:underline">
          {row.invoiceNumber}
        </Link>
      ),
    },
    { key: "load", header: "Load", render: (row) => row.load.loadNumber },
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
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Payments</h1>
      <p className="mt-1 text-sm text-muted-foreground">Settlement history — amounts owed and paid by the brokerage.</p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={settlements}
          emptyState={<EmptyState icon={Receipt} title="No settlements yet" description="Settlements are issued once a load you hauled is completed." />}
        />
      </div>
    </div>
  );
}
