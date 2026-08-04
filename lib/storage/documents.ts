import type { DocumentType, DocumentVisibility } from "@/lib/generated/prisma/client";
import type { RoleName } from "@/lib/auth/roles";

/**
 * Single source of truth for document storage — bucket name, size/MIME
 * limits, per-role allowed document types, and the storage path
 * convention. Previously duplicated three times (ops/shipper/carrier
 * upload actions) with drifting document-type allowlists; consolidated
 * here per context/06-development-roadmap.md Phase 6 ("document type
 * validation, visibility enforcement... polish").
 */
export const DOCUMENTS_BUCKET = "documents";
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

// Common formats for a scanned/photographed shipping document — a driver
// photographing a POD on their phone is the single most common real-world
// case, so HEIC (iPhone default) is included alongside PDF/JPEG/PNG.
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  rate_confirmation: "Rate Confirmation",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
  invoice: "Invoice",
  other: "Other",
};

const ALL_DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[];

/**
 * Which document types + visibility a role may upload, and whether the
 * document is load-scoped or company-scoped ("compliance"). Mirrors the
 * authorization that used to live separately in
 * app/ops/documents/actions.ts, app/shipper/documents/actions.ts, and
 * app/carrier/documents/actions.ts — behavior is unchanged, just no longer
 * triplicated and drifting.
 */
export type UploadScope = "load" | "compliance";

export type PortalUploadRule = {
  types: DocumentType[];
  visibility: DocumentVisibility;
  scope: UploadScope;
};

/** Ops roles pick their own visibility per-upload (existing behavior) — this is the allowlist only; visibility is caller-supplied for these roles. */
export const OPS_ROLES: RoleName[] = ["super_admin", "brokerage_admin", "broker"];

export function uploadRulesForRole(role: RoleName): PortalUploadRule[] {
  if (OPS_ROLES.includes(role)) {
    return [
      { types: ALL_DOCUMENT_TYPES, visibility: "internal", scope: "load" },
      { types: ALL_DOCUMENT_TYPES, visibility: "shipper", scope: "load" },
      { types: ALL_DOCUMENT_TYPES, visibility: "carrier", scope: "load" },
      { types: ALL_DOCUMENT_TYPES, visibility: "public", scope: "load" },
    ];
  }
  if (role === "shipper_user") {
    return [{ types: ["rate_confirmation", "insurance_certificate", "w9", "other"], visibility: "shipper", scope: "load" }];
  }
  if (role === "carrier_user" || role === "driver") {
    return [
      { types: ["bol", "pod"], visibility: "carrier", scope: "load" },
      { types: ["insurance_certificate", "w9"], visibility: "internal", scope: "compliance" },
    ];
  }
  return [];
}

export function buildStoragePath(params: {
  companyId: string;
  loadId: string | null;
  documentId: string;
  fileName: string;
}): string {
  const safeName = params.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const folder = params.loadId ?? "compliance";
  return `${params.companyId}/${folder}/${params.documentId}-${safeName}`;
}
