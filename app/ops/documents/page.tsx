import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DOCUMENT_STATUS_META } from "@/lib/status";
import { DocumentReviewActions } from "./review-actions";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  rate_confirmation: "Rate Confirmation",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
  invoice: "Invoice",
  other: "Other",
};

export default async function OpsDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "documents:approve"))) redirect("/ops/dashboard");

  const documents = await db.document.findMany({
    where: { status: "pending_review" },
    include: { load: { select: { loadNumber: true } }, ownerCompany: { select: { legalName: true, dbaName: true } } },
    orderBy: { createdAt: "asc" },
  });

  const columns: DataTableColumn<(typeof documents)[number]>[] = [
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <div>
          <div className="font-medium">{DOCUMENT_TYPE_LABEL[row.documentType] ?? row.documentType}</div>
          <div className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: "context",
      header: "Load / Company",
      render: (row) =>
        row.loadId && row.load ? (
          <Link href={`/ops/loads/${row.loadId}`} className="text-primary hover:underline">
            {row.load.loadNumber}
          </Link>
        ) : (
          (row.ownerCompany?.dbaName ?? row.ownerCompany?.legalName ?? "—")
        ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => <span className="text-xs capitalize">{row.visibility}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge meta={DOCUMENT_STATUS_META[row.status]} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => <DocumentReviewActions documentId={row.id} />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Documents</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cross-load review queue — approve or reject pending documents.</p>
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={documents}
          emptyState={<EmptyState icon={FileText} title="Nothing pending review" description="All uploaded documents have been reviewed." />}
        />
      </div>
    </div>
  );
}
