import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DOCUMENT_STATUS_META } from "@/lib/status";
import { DocumentUploadForm } from "@/components/shared/document-upload-form";
import { DOCUMENT_TYPE_LABEL } from "@/lib/storage/documents";
import type { DocumentType } from "@/lib/generated/prisma/client";

const CARRIER_COMPLIANCE_DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "insurance_certificate", label: DOCUMENT_TYPE_LABEL.insurance_certificate },
  { value: "w9", label: DOCUMENT_TYPE_LABEL.w9 },
];

export default async function CarrierDocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [complianceDocs, loadDocs] = await Promise.all([
    db.document.findMany({ where: { ownerCompanyId: user.companyId }, orderBy: { createdAt: "desc" } }),
    db.document.findMany({
      where: { load: { carrierAssignments: { some: { carrierCompanyId: user.companyId } } }, visibility: { in: ["carrier", "public"] } },
      include: { load: { select: { id: true, loadNumber: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Documents</h1>
      <p className="mt-1 text-sm text-muted-foreground">Compliance documents for your company, and per-load documents.</p>

      <div className="mt-6 rounded-lg border p-4">
        <DocumentUploadForm documentTypes={CARRIER_COMPLIANCE_DOCUMENT_TYPES} toggleLabel="Upload" />
        {complianceDocs.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {complianceDocs.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                <Link href={`/api/documents/${d.id}/download`} className="font-medium text-primary hover:underline">
                  {DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}
                </Link>
                <StatusBadge meta={DOCUMENT_STATUS_META[d.status]} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No compliance documents uploaded yet.</p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold">Load documents</h2>
        <div className="mt-3">
          {loadDocs.length === 0 ? (
            <EmptyState icon={FileText} title="No load documents yet" description="Upload BOL/POD from a load's detail page." />
          ) : (
            <ul className="space-y-2">
              {loadDocs.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <Link href={`/api/documents/${d.id}/download`} className="font-medium text-primary hover:underline">
                      {DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}
                    </Link>
                    {d.load ? (
                      <div>
                        <Link href={`/carrier/loads/${d.load.id}`} className="text-xs text-muted-foreground hover:underline">
                          {d.load.loadNumber}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge meta={DOCUMENT_STATUS_META[d.status]} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
