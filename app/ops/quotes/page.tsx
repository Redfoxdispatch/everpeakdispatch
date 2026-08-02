import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { QUOTE_STATUS_META } from "@/lib/status";

export default async function OpsQuotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "quotes:create"))) redirect("/ops/dashboard");

  const quotes = await db.quote.findMany({
    include: { load: { include: { shipperCompany: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const columns: DataTableColumn<(typeof quotes)[number]>[] = [
    {
      key: "load",
      header: "Load",
      render: (row) => (
        <Link href={`/ops/loads/${row.loadId}`} className="font-medium text-primary hover:underline">
          {row.load.loadNumber}
        </Link>
      ),
    },
    {
      key: "shipper",
      header: "Shipper",
      render: (row) => row.load.shipperCompany.dbaName ?? row.load.shipperCompany.legalName,
    },
    {
      key: "version",
      header: "Version",
      render: (row) => `v${row.version}${row.previousQuoteId ? " (re-quote)" : ""}`,
    },
    {
      key: "rate",
      header: "Sell rate",
      className: "text-right",
      render: (row) => `$${Number(row.sellRate).toLocaleString()} ${row.currency}`,
    },
    {
      key: "validUntil",
      header: "Valid until",
      render: (row) => {
        const expired = row.status === "pending" && row.validUntil < new Date();
        return (
          <span className={expired ? "text-destructive" : ""}>{row.validUntil.toLocaleString()}</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={QUOTE_STATUS_META[row.status]} />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Quotes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every quote across every shipper. Accept, reject, and re-quote from a load&apos;s own detail page.
      </p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={quotes}
          emptyState={
            <EmptyState icon={FileSpreadsheet} title="No quotes yet" description="Quotes are created from a load's detail page." />
          }
        />
      </div>
    </div>
  );
}
