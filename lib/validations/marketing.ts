import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

const signupPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const shipperSignupSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  industry: z.string().trim().max(200).optional().or(z.literal("")),
  fullName: z.string().trim().min(1, "Your name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: signupPassword,
});

export type ShipperSignupInput = z.infer<typeof shipperSignupSchema>;

export const carrierSignupSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  mcNumber: z.string().trim().min(1, "MC number is required").max(50),
  dotNumber: z.string().trim().min(1, "DOT number is required").max(50),
  insuranceExpiryDate: z
    .string()
    .trim()
    .min(1, "Insurance expiry date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  equipmentTypes: z.array(z.string()).min(1, "Select at least one equipment type"),
  fullName: z.string().trim().min(1, "Your name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: signupPassword,
});

export type CarrierSignupInput = z.infer<typeof carrierSignupSchema>;
