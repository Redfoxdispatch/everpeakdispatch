import { z } from "zod";

export const createDriverSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(50).optional().or(z.literal("")),
  licenseExpiry: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
