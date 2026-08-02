import { z } from "zod";

const stopSchema = z
  .object({
    stopType: z.enum(["pickup", "delivery"]),
    line1: z.string().trim().min(1, "Address is required").max(200),
    line2: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().min(1, "City is required").max(100),
    state: z.string().trim().min(1, "State is required").max(50),
    zip: z.string().trim().min(1, "ZIP is required").max(20),
    appointmentEarliest: z
      .string()
      .trim()
      .min(1, "Earliest appointment is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date/time"),
    appointmentLatest: z
      .string()
      .trim()
      .min(1, "Latest appointment is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date/time"),
  })
  .refine((s) => Date.parse(s.appointmentEarliest) <= Date.parse(s.appointmentLatest), {
    message: "Earliest appointment must be before the latest",
    path: ["appointmentLatest"],
  });

export const createLoadSchema = z.object({
  shipperCompanyId: z.string().uuid("Select a shipper"),
  mode: z.enum(["ftl", "ltl"]),
  equipmentType: z.string().trim().min(1, "Select an equipment type"),
  commodity: z.string().trim().min(1, "Commodity is required").max(200),
  weightLbs: z.coerce.number().int().positive("Weight must be greater than 0"),
  specialInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  stops: z
    .array(stopSchema)
    .min(2, "At least a pickup and a delivery stop are required")
    .refine((stops) => stops[0]?.stopType === "pickup", "The first stop must be a pickup")
    .refine((stops) => stops[stops.length - 1]?.stopType === "delivery", "The last stop must be a delivery"),
});

export type CreateLoadInput = z.infer<typeof createLoadSchema>;

export const updateLoadStatusSchema = z.object({
  loadId: z.string().uuid(),
  status: z.enum([
    "draft",
    "quote_requested",
    "quoted",
    "booked",
    "carrier_sourcing",
    "dispatched",
    "at_pickup",
    "picked_up",
    "in_transit",
    "at_delivery",
    "delivered",
    "completed",
    "invoiced",
    "paid",
    "closed",
  ]),
});

export const cancelLoadSchema = z.object({
  loadId: z.string().uuid(),
  reason: z.string().trim().min(1, "A cancellation reason is required").max(500),
});
