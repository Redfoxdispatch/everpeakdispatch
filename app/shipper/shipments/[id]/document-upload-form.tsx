"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { uploadShipperDocument, type DocumentActionState } from "../../documents/actions";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  rate_confirmation: "Rate Confirmation",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
  other: "Other",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Uploading..." : "Upload"}
    </Button>
  );
}

export function DocumentUploadForm({ loadId }: { loadId: string }) {
  const [state, formAction] = useActionState<DocumentActionState, FormData>(uploadShipperDocument, {});
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Documents</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Upload"}
        </Button>
      </div>

      {showForm ? (
        <form action={formAction} className="mt-3 space-y-3 rounded-lg border p-4">
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
            <label className="text-xs font-medium text-muted-foreground">File</label>
            <input
              type="file"
              name="file"
              required
              className={`mt-1 ${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs`}
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <SubmitButton />
        </form>
      ) : null}
    </div>
  );
}
