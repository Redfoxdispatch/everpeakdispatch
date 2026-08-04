import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentUploadForm } from "@/components/shared/document-upload-form";
import { DOCUMENT_STATUS_META } from "@/lib/status";
import { DOCUMENT_TYPE_LABEL } from "@/lib/storage/documents";
import type { DocumentType, DocumentVisibility } from "@/lib/generated/prisma/client";

type DocumentRow = {
  id: string;
  documentType: string;
  visibility: "internal" | "shipper" | "carrier" | "public";
  status: "pending_review" | "approved" | "rejected";
  rejectedReason: string | null;
};

const ALL_DOCUMENT_TYPES = Object.entries(DOCUMENT_TYPE_LABEL).map(([value, label]) => ({
  value: value as DocumentType,
  label,
}));

const VISIBILITY_OPTIONS: { value: DocumentVisibility; label: string }[] = [
  { value: "internal", label: "Internal only" },
  { value: "shipper", label: "Shipper" },
  { value: "carrier", label: "Carrier" },
  { value: "public", label: "Public" },
];

export function DocumentPanel({ loadId, documents, canUpload }: { loadId: string; documents: DocumentRow[]; canUpload: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      {canUpload ? (
        <DocumentUploadForm loadId={loadId} documentTypes={ALL_DOCUMENT_TYPES} visibilityOptions={VISIBILITY_OPTIONS} />
      ) : (
        <h2 className="text-sm font-semibold">Documents</h2>
      )}

      {documents.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
              <div>
                <Link href={`/api/documents/${d.id}/download`} className="font-medium text-primary hover:underline">
                  {DOCUMENT_TYPE_LABEL[d.documentType as DocumentType] ?? d.documentType}
                </Link>
                {d.rejectedReason ? <div className="text-xs text-destructive">{d.rejectedReason}</div> : null}
              </div>
              <StatusBadge meta={DOCUMENT_STATUS_META[d.status]} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No documents uploaded yet.</p>
      )}
    </div>
  );
}
