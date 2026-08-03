import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DOCUMENT_STATUS_META } from "@/lib/status";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  rate_confirmation: "Rate Confirmation",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
  invoice: "Invoice",
  other: "Other",
};

export default async function ShipperDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const documents = await db.document.findMany({
    where: { load: { shipperCompanyId: user.companyId }, visibility: { in: ["shipper", "public"] } },
    include: { load: { select: { id: true, loadNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  const columns: DataTableColumn<(typeof documents)[number]>[] = [
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <div>
          <div className="font-medium">{DOCUMENT_TYPE_LABEL[row.documentType] ?? row.documentType}</div>
          <div className="text-xs text-muted-foreground">{row.createdAt.toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: "shipment",
      header: "Shipment",
      render: (row) =>
        row.load ? (
          <Link href={`/shipper/shipments/${row.load.id}`} className="text-primary hover:underline">
            {row.load.loadNumber}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={DOCUMENT_STATUS_META[row.status]} />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Documents</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every document across your shipments. Upload new documents from a shipment&apos;s detail page.
      </p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={documents}
          emptyState={<EmptyState icon={FileText} title="No documents yet" description="Documents uploaded to your shipments will appear here." />}
        />
      </div>
    </div>
  );
}
