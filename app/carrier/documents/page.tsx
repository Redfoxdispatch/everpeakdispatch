import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DOCUMENT_STATUS_META } from "@/lib/status";
import { ComplianceUploadForm } from "./compliance-upload-form";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
};

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
        <ComplianceUploadForm />
        {complianceDocs.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {complianceDocs.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                <div className="font-medium">{DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}</div>
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
                    <div className="font-medium">{DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}</div>
                    {d.load ? (
                      <Link href={`/carrier/loads/${d.load.id}`} className="text-xs text-primary hover:underline">
                        {d.load.loadNumber}
                      </Link>
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
