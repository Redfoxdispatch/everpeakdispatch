"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { generateLoadNumber } from "@/lib/loads/generate-load-number";
import { createShipmentSchema } from "@/lib/validations/load";

export type CreateShipmentState = { error?: string };

export async function createShipment(_prevState: CreateShipmentState, formData: FormData): Promise<CreateShipmentState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "loads:create");

  let stops: unknown;
  try {
    stops = JSON.parse(String(formData.get("stopsJson") ?? "[]"));
  } catch {
    return { error: "Could not read stop details. Please try again." };
  }

  const parsed = createShipmentSchema.safeParse({
    mode: formData.get("mode"),
    equipmentType: formData.get("equipmentType"),
    commodity: formData.get("commodity"),
    weightLbs: formData.get("weightLbs"),
    specialInstructions: formData.get("specialInstructions"),
    stops,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const equipment = await db.equipmentType.findUnique({ where: { code: parsed.data.equipmentType } });
  if (!equipment || !equipment.active) {
    return { error: "Select a valid equipment type." };
  }

  const loadNumber = await generateLoadNumber();

  const load = await db.load.create({
    data: {
      loadNumber,
      shipperCompanyId: user.companyId,
      status: "quote_requested",
      mode: parsed.data.mode,
      equipmentType: parsed.data.equipmentType,
      commodity: parsed.data.commodity,
      weightLbs: parsed.data.weightLbs,
      specialInstructions: parsed.data.specialInstructions || null,
      createdBy: user.id,
      stops: {
        create: parsed.data.stops.map((stop, index) => ({
          stopType: stop.stopType,
          sequence: index + 1,
          address: { line1: stop.line1, line2: stop.line2 || undefined, city: stop.city, state: stop.state, zip: stop.zip },
          appointmentEarliest: new Date(stop.appointmentEarliest),
          appointmentLatest: new Date(stop.appointmentLatest),
        })),
      },
    },
  });

  await db.trackingEvent.create({
    data: { loadId: load.id, eventType: "status_change", status: "quote_requested", source: "manual", createdBy: user.id },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "load.created",
    entityType: "loads",
    entityId: load.id,
    after: { loadNumber: load.loadNumber, shipperCompanyId: load.shipperCompanyId, status: load.status },
  });

  revalidatePath("/shipper/shipments");
  revalidatePath("/shipper/dashboard");
  redirect(`/shipper/shipments/${load.id}`);
}
