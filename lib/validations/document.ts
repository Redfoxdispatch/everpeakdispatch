import { z } from "zod";

export const rejectDocumentSchema = z.object({
  documentId: z.string().uuid(),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});
