import { z } from "zod";

export const uploadDocumentSchema = z.object({
  loadId: z.string().uuid(),
  documentType: z.enum(["bol", "pod", "rate_confirmation", "insurance_certificate", "w9", "invoice", "other"]),
  visibility: z.enum(["internal", "shipper", "carrier", "public"]),
});

export const rejectDocumentSchema = z.object({
  documentId: z.string().uuid(),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});
