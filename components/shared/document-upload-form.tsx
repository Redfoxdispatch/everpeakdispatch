"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { requestDocumentUpload, confirmDocumentUpload } from "@/lib/documents/actions";
import { DOCUMENTS_BUCKET } from "@/lib/storage/documents";
import type { DocumentType, DocumentVisibility } from "@/lib/generated/prisma/client";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-medium text-muted-foreground";

// PDF/JPEG/PNG/WEBP/HEIC — matches lib/storage/documents.ts's ALLOWED_MIME_TYPES.
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/*";

export function DocumentUploadForm({
  loadId,
  documentTypes,
  visibilityOptions,
  toggleLabel = "Upload",
}: {
  loadId?: string;
  documentTypes: { value: DocumentType; label: string }[];
  visibilityOptions?: { value: DocumentVisibility; label: string }[];
  toggleLabel?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [visibility, setVisibility] = useState<DocumentVisibility | "">(visibilityOptions?.[0]?.value ?? "");
  const [fileInputKey, setFileInputKey] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Select a file to upload.");
      return;
    }
    if (!documentType) {
      setError("Select a document type.");
      return;
    }

    setPending(true);
    try {
      const requested = await requestDocumentUpload({
        loadId,
        documentType,
        visibility: visibility || undefined,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      if ("error" in requested) {
        setError(requested.error);
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .uploadToSignedUrl(requested.path, requested.token, file, { contentType: file.type });
      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      const confirmed = await confirmDocumentUpload({
        documentId: requested.documentId,
        loadId,
        documentType,
        visibility: visibility || undefined,
        filePath: requested.path,
      });
      if (confirmed.error) {
        setError(confirmed.error);
        return;
      }

      setShowForm(false);
      setDocumentType("");
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed unexpectedly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Documents</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : toggleLabel}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border p-4">
          <div>
            <label className={labelClass}>Document type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              required
              className={`mt-1 ${inputClass}`}
            >
              <option value="" disabled>
                Select type
              </option>
              {documentTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {visibilityOptions ? (
            <div>
              <label className={labelClass}>Visible to</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
                required
                className={`mt-1 ${inputClass}`}
              >
                {visibilityOptions.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className={labelClass}>File</label>
            <input
              key={fileInputKey}
              type="file"
              name="file"
              accept={ACCEPT}
              required
              className={`mt-1 ${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs`}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
