import { z } from "zod";

export const upsertVehicleSchema = z.object({
  equipmentType: z.string().trim().min(1, "Select an equipment type"),
  vin: z.string().trim().max(50).optional().or(z.literal("")),
  plateNumber: z.string().trim().max(20).optional().or(z.literal("")),
  capacityWeightLbs: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(["active", "maintenance", "inactive"]),
});

export type UpsertVehicleInput = z.infer<typeof upsertVehicleSchema>;
