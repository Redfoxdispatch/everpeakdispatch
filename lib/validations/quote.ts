import { z } from "zod";

export const createQuoteSchema = z.object({
  loadId: z.string().uuid(),
  sellRate: z.coerce.number().positive("Sell rate must be greater than 0"),
  validUntil: z
    .string()
    .trim()
    .min(1, "Valid-until is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date/time"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
