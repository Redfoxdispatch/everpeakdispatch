"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { notifyUser } from "@/lib/notifications/create";
import { rejectDocumentSchema } from "@/lib/validations/document";

export type DocumentActionState = { error?: string };

const LOAD_DETAIL_PATH: Record<string, string> = { internal: "/ops/loads", shipper: "/shipper/shipments", carrier: "/carrier/loads" };
const DOCUMENTS_PATH: Record<string, string> = { internal: "/ops/documents", shipper: "/shipper/documents", carrier: "/carrier/documents" };

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

  const document = await db.document.findUnique({
    where: { id: documentId },
    include: { uploader: { include: { company: { select: { type: true } } } } },
  });
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

  const uploaderPortal = document.uploader.company.type;
  const link = document.loadId
    ? `${LOAD_DETAIL_PATH[uploaderPortal] ?? "/ops/loads"}/${document.loadId}`
    : (DOCUMENTS_PATH[uploaderPortal] ?? "/ops/documents");
  await notifyUser(document.uploadedBy, {
    type: "document_rejected",
    title: "A document you uploaded was rejected",
    body: parsed.data.reason,
    link,
  });

  revalidatePath("/ops/documents");
  if (document.loadId) revalidatePath(`/ops/loads/${document.loadId}`);
  return {};
}
