"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";

export type DocumentActionState = { error?: string };

const DOCUMENTS_BUCKET = "documents";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const PER_LOAD_TYPES = ["bol", "pod"] as const;
const COMPLIANCE_TYPES = ["insurance_certificate", "w9"] as const;

/**
 * `documents:upload` carries no `:own` suffix, so this must independently
 * verify ownership before writing anything — same reasoning as the shipper
 * document action. Two distinct cases:
 *  - per-load (BOL/POD): the actor's company must hold an `accepted`
 *    carrier_assignments row for that load.
 *  - compliance (insurance/W-9): company-level, no load — the document is
 *    just owned by the actor's own company (`ownerCompanyId`).
 */
export async function uploadCarrierDocument(_prevState: DocumentActionState, formData: FormData): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:upload");

  const documentType = String(formData.get("documentType") ?? "");
  const loadId = formData.get("loadId") ? String(formData.get("loadId")) : null;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Select a file to upload." };
  if (file.size > MAX_FILE_BYTES) return { error: "File is too large (20MB max)." };

  let storagePath: string;

  if ((PER_LOAD_TYPES as readonly string[]).includes(documentType)) {
    if (!loadId) return { error: "A shipment is required for this document type." };
    const assignment = await db.carrierAssignment.findFirst({
      where: { loadId, carrierCompanyId: user.companyId, status: "accepted" },
    });
    if (!assignment) return { error: "Shipment not found." };
    storagePath = `${user.companyId}/${loadId}`;
  } else if ((COMPLIANCE_TYPES as readonly string[]).includes(documentType)) {
    storagePath = `${user.companyId}/compliance`;
  } else {
    return { error: "Invalid document type." };
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${storagePath}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await admin.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const document = await db.document.create({
    data: {
      loadId: (PER_LOAD_TYPES as readonly string[]).includes(documentType) ? loadId : null,
      ownerCompanyId: (COMPLIANCE_TYPES as readonly string[]).includes(documentType) ? user.companyId : null,
      documentType: documentType as (typeof PER_LOAD_TYPES)[number] | (typeof COMPLIANCE_TYPES)[number],
      filePath: path,
      visibility: (PER_LOAD_TYPES as readonly string[]).includes(documentType) ? "carrier" : "internal",
      uploadedBy: user.id,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "document.uploaded",
    entityType: "documents",
    entityId: document.id,
    after: { loadId, documentType },
  });

  if (loadId) revalidatePath(`/carrier/loads/${loadId}`);
  revalidatePath("/carrier/documents");
  return {};
}
