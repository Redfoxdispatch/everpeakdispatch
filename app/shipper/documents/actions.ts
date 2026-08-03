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
const SHIPPER_DOCUMENT_TYPES = ["rate_confirmation", "insurance_certificate", "w9", "other"] as const;

/**
 * `documents:upload` carries no `:own` suffix (lib/permissions/constants.ts),
 * so unlike app/ops/documents/actions.ts's uploadDocument (which any broker
 * may legitimately point at any load), this action must independently
 * verify the load belongs to the actor's own shipper company before writing
 * anything — otherwise any shipper could upload to any load by guessing an
 * id. Visibility is hardcoded to "shipper" rather than caller-selectable,
 * since a shipper has no reason to set carrier/internal-only visibility.
 */
export async function uploadShipperDocument(_prevState: DocumentActionState, formData: FormData): Promise<DocumentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "documents:upload");

  const loadId = String(formData.get("loadId") ?? "");
  const documentType = String(formData.get("documentType") ?? "");
  if (!loadId || !(SHIPPER_DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
    return { error: "Invalid input" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select a file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "File is too large (20MB max)." };
  }

  const load = await db.load.findUnique({ where: { id: loadId }, select: { id: true, shipperCompanyId: true, deletedAt: true } });
  if (!load || load.deletedAt || load.shipperCompanyId !== user.companyId) {
    return { error: "Shipment not found." };
  }

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
      documentType: documentType as (typeof SHIPPER_DOCUMENT_TYPES)[number],
      filePath: path,
      visibility: "shipper",
      uploadedBy: user.id,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "document.uploaded",
    entityType: "documents",
    entityId: document.id,
    after: { loadId: load.id, documentType },
  });

  revalidatePath(`/shipper/shipments/${load.id}`);
  revalidatePath("/shipper/documents");
  return {};
}
