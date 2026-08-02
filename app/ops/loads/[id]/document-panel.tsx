"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { DOCUMENT_STATUS_META } from "@/lib/status";
import { uploadDocument, type DocumentActionState } from "../../documents/actions";

type DocumentRow = {
  id: string;
  documentType: string;
  visibility: "internal" | "shipper" | "carrier" | "public";
  status: "pending_review" | "approved" | "rejected";
  rejectedReason: string | null;
};

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  rate_confirmation: "Rate Confirmation",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
  invoice: "Invoice",
  other: "Other",
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Uploading..." : "Upload"}
    </Button>
  );
}

export function DocumentPanel({ loadId, documents, canUpload }: { loadId: string; documents: DocumentRow[]; canUpload: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction] = useActionState<DocumentActionState, FormData>(uploadDocument, {});

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Documents</h2>
        {canUpload ? (
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Upload"}
          </Button>
        ) : null}
      </div>

      {documents.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
              <div>
                <div className="font-medium">{DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}</div>
                {d.rejectedReason ? <div className="text-xs text-destructive">{d.rejectedReason}</div> : null}
              </div>
              <StatusBadge meta={DOCUMENT_STATUS_META[d.status]} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No documents uploaded yet.</p>
      )}

      {canUpload && showForm ? (
        <form action={formAction} className="mt-4 space-y-3 border-t pt-4">
          <input type="hidden" name="loadId" value={loadId} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Document type</label>
            <select name="documentType" required className={`mt-1 ${inputClass}`} defaultValue="">
              <option value="" disabled>
                Select type
              </option>
              {Object.entries(DOCUMENT_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Visible to</label>
            <select name="visibility" required className={`mt-1 ${inputClass}`} defaultValue="internal">
              <option value="internal">Internal only</option>
              <option value="shipper">Shipper</option>
              <option value="carrier">Carrier</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">File</label>
            <input type="file" name="file" required className={`mt-1 ${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs`} />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <SubmitButton />
        </form>
      ) : null}
    </div>
  );
}
