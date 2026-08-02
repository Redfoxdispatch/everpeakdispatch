"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadDocumentSchema, rejectDocumentSchema } from "@/lib/validations/document";

export type DocumentActionState = { error?: string };

const DOCUMENTS_BUCKET = "documents";
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * Uploads server-side via the service-role client rather than the full
 * signed-URL direct-to-browser flow in context/04-application-architecture.md
 * §5 — that flow is explicitly Phase 6 scope ("Signed upload/download flows
 * fully wired (may have been stubbed in earlier phases)"). This is a real,
 * working upload (not a fake stub), just not the eventual browser-direct
 * pattern; swapping to that later doesn't change the `documents` row shape
 * or the review-queue UI.
 *
 * Requires a private Storage bucket named "documents" to already exist in
 * the Supabase project — a one-time dashboard setup step, not something
 * this code can create for you.
 */
export async function uploadDocument(_prevState: DocumentActionState, formData: FormData): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:upload");

  const parsed = uploadDocumentSchema.safeParse({
    loadId: formData.get("loadId"),
    documentType: formData.get("documentType"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "File is too large (20MB max)." };
  }

  const load = await db.load.findUnique({ where: { id: parsed.data.loadId }, select: { id: true, shipperCompanyId: true } });
  if (!load) return { error: "Load not found." };

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${load.shipperCompanyId}/${load.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await admin.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const document = await db.document.create({
    data: {
      loadId: load.id,
      documentType: parsed.data.documentType,
      filePath: path,
      visibility: parsed.data.visibility,
      uploadedBy: user.id,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "document.uploaded",
    entityType: "documents",
    entityId: document.id,
    after: { loadId: load.id, documentType: parsed.data.documentType },
  });

  revalidatePath(`/ops/loads/${load.id}`);
  revalidatePath("/ops/documents");
  return {};
}

export async function approveDocument(documentId: string): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:approve");

  const document = await db.document.findUnique({ where: { id: documentId } });
  if (!document) return { error: "Document not found." };
  if (document.status !== "pending_review") return { error: "This document has already been reviewed." };

  await db.document.update({ where: { id: documentId }, data: { status: "approved" } });
  await writeAuditLog({
    actorUserId: user.id,
    action: "document.approved",
    entityType: "documents",
    entityId: documentId,
    before: { status: "pending_review" },
    after: { status: "approved" },
  });

  revalidatePath("/ops/documents");
  if (document.loadId) revalidatePath(`/ops/loads/${document.loadId}`);
  return {};
}

export async function rejectDocument(documentId: string, reason: string): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:approve");

  const parsed = rejectDocumentSchema.safeParse({ documentId, reason });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "A reason is required." };
  }

  const document = await db.document.findUnique({ where: { id: documentId } });
  if (!document) return { error: "Document not found." };
  if (document.status !== "pending_review") return { error: "This document has already been reviewed." };

  await db.document.update({
    where: { id: documentId },
    data: { status: "rejected", rejectedReason: parsed.data.reason },
  });
  await writeAuditLog({
    actorUserId: user.id,
    action: "document.rejected",
    entityType: "documents",
    entityId: documentId,
    before: { status: "pending_review" },
    after: { status: "rejected", reason: parsed.data.reason },
  });

  revalidatePath("/ops/documents");
  if (document.loadId) revalidatePath(`/ops/loads/${document.loadId}`);
  return {};
}
