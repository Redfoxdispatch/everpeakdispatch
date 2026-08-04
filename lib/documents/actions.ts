"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { notifyUser } from "@/lib/notifications/create";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DOCUMENTS_BUCKET,
  MAX_FILE_BYTES,
  ALLOWED_MIME_TYPES,
  OPS_ROLES,
  DOCUMENT_TYPE_LABEL,
  uploadRulesForRole,
  buildStoragePath,
} from "@/lib/storage/documents";
import type { DocumentType, DocumentVisibility } from "@/lib/generated/prisma/client";

export type DocumentActionState = { error?: string };

type RequestUploadInput = {
  loadId?: string;
  documentType: DocumentType;
  visibility?: DocumentVisibility;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

type ResolvedAuthorization = {
  loadId: string | null;
  ownerCompanyId: string | null;
  visibility: DocumentVisibility;
  pathCompanyId: string;
};

/**
 * Re-derives and re-validates upload authorization from the actor's role +
 * the target load/company — called from BOTH requestDocumentUpload and
 * confirmDocumentUpload. Never trust client-supplied documentType/visibility
 * across the two-step flow without re-checking each time: the signed URL
 * only pins *where* the bytes land, not what metadata the client claims
 * afterward.
 */
async function resolveUploadAuthorization(
  user: CurrentUser,
  input: { loadId?: string; documentType: DocumentType; visibility?: DocumentVisibility },
): Promise<ResolvedAuthorization | { error: string }> {
  const rules = uploadRulesForRole(user.role);
  const isOps = OPS_ROLES.includes(user.role);

  const matchedRule = rules.find(
    (rule) => rule.types.includes(input.documentType) && (!isOps || rule.visibility === input.visibility),
  );
  if (!matchedRule) return { error: "You can't upload this document type." };

  if (matchedRule.scope === "compliance") {
    return { loadId: null, ownerCompanyId: user.companyId, visibility: matchedRule.visibility, pathCompanyId: user.companyId };
  }

  if (!input.loadId) return { error: "A shipment is required for this document type." };
  const load = await db.load.findUnique({ where: { id: input.loadId }, select: { id: true, shipperCompanyId: true, deletedAt: true } });
  if (!load || load.deletedAt) return { error: "Shipment not found." };

  if (isOps) {
    // Ops is trusted to attach documents to any active load (existing behavior).
    return { loadId: load.id, ownerCompanyId: null, visibility: matchedRule.visibility, pathCompanyId: load.shipperCompanyId };
  }

  if (user.role === "shipper_user") {
    if (load.shipperCompanyId !== user.companyId) return { error: "Shipment not found." };
    return { loadId: load.id, ownerCompanyId: null, visibility: matchedRule.visibility, pathCompanyId: load.shipperCompanyId };
  }

  // carrier_user / driver, scope "load"
  const assignment = await db.carrierAssignment.findFirst({
    where: { loadId: load.id, carrierCompanyId: user.companyId, status: "accepted" },
  });
  if (!assignment) return { error: "Shipment not found." };
  return { loadId: load.id, ownerCompanyId: null, visibility: matchedRule.visibility, pathCompanyId: load.shipperCompanyId };
}

export async function requestDocumentUpload(
  input: RequestUploadInput,
): Promise<{ signedUrl: string; token: string; path: string; documentId: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:upload");

  if (!input.fileName || input.fileSize <= 0) return { error: "Select a file to upload." };
  if (input.fileSize > MAX_FILE_BYTES) return { error: "File is too large (20MB max)." };
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(input.mimeType)) {
    return { error: "Unsupported file type — upload a PDF, JPG, PNG, WEBP, or HEIC file." };
  }

  const resolved = await resolveUploadAuthorization(user, input);
  if ("error" in resolved) return resolved;

  const documentId = crypto.randomUUID();
  const path = buildStoragePath({ companyId: resolved.pathCompanyId, loadId: resolved.loadId, documentId, fileName: input.fileName });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: `Could not prepare upload: ${error?.message ?? "unknown error"}` };

  return { signedUrl: data.signedUrl, token: data.token, path: data.path, documentId };
}

type ConfirmUploadInput = {
  documentId: string;
  loadId?: string;
  documentType: DocumentType;
  visibility?: DocumentVisibility;
  filePath: string;
};

export async function confirmDocumentUpload(input: ConfirmUploadInput): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:upload");

  const resolved = await resolveUploadAuthorization(user, input);
  if ("error" in resolved) return resolved;

  const document = await db.document.create({
    data: {
      id: input.documentId,
      loadId: resolved.loadId,
      ownerCompanyId: resolved.ownerCompanyId,
      documentType: input.documentType,
      filePath: input.filePath,
      visibility: resolved.visibility,
      uploadedBy: user.id,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "document.uploaded",
    entityType: "documents",
    entityId: document.id,
    after: { loadId: resolved.loadId, documentType: input.documentType, visibility: resolved.visibility },
  });

  // context/01-business-workflow.md §5: "Document uploaded (POD, BOL) →
  // broker notified" — only meaningful when someone other than ops uploaded
  // it (a broker uploading their own BOL doesn't need to self-notify).
  if (resolved.loadId && (input.documentType === "bol" || input.documentType === "pod") && !OPS_ROLES.includes(user.role)) {
    const load = await db.load.findUnique({ where: { id: resolved.loadId }, select: { loadNumber: true, createdBy: true } });
    if (load) {
      await notifyUser(load.createdBy, {
        type: "document_uploaded",
        title: `${DOCUMENT_TYPE_LABEL[input.documentType]} uploaded for ${load.loadNumber}`,
        link: `/ops/loads/${resolved.loadId}`,
      });
    }
  }

  if (resolved.loadId) {
    revalidatePath(`/ops/loads/${resolved.loadId}`);
    revalidatePath(`/shipper/shipments/${resolved.loadId}`);
    revalidatePath(`/carrier/loads/${resolved.loadId}`);
  }
  revalidatePath("/ops/documents");
  revalidatePath("/shipper/documents");
  revalidatePath("/carrier/documents");
  return {};
}
