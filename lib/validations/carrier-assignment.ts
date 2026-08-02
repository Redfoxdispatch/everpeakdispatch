import { z } from "zod";

export const offerToCarrierSchema = z.object({
  loadId: z.string().uuid(),
  carrierCompanyId: z.string().uuid("Select a carrier"),
  carrierRate: z.coerce.number().positive("Carrier rate must be greater than 0"),
});

export type OfferToCarrierInput = z.infer<typeof offerToCarrierSchema>;
