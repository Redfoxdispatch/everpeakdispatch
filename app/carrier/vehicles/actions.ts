"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { upsertVehicleSchema } from "@/lib/validations/vehicle";

export type VehicleActionState = { error?: string };

/**
 * No dedicated `vehicles:*` permission key exists in the RBAC matrix — a
 * carrier managing their own fleet roster is scoped entirely by company
 * ownership, not a role permission, so this only checks the actor is a
 * carrier_user/brokerage-side role via `companies:read:own` (already granted
 * to carrier_user) plus an explicit `carrierId = user.companyId` check on
 * every mutation.
 */
export async function createVehicle(_prevState: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "companies:read:own", user.companyId);

  const parsed = upsertVehicleSchema.safeParse({
    equipmentType: formData.get("equipmentType"),
    vin: formData.get("vin"),
    plateNumber: formData.get("plateNumber"),
    capacityWeightLbs: formData.get("capacityWeightLbs"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const equipment = await db.equipmentType.findUnique({ where: { code: parsed.data.equipmentType } });
  if (!equipment || !equipment.active) return { error: "Select a valid equipment type." };

  const vehicle = await db.vehicle.create({
    data: {
      carrierId: user.companyId,
      equipmentType: parsed.data.equipmentType,
      vin: parsed.data.vin || null,
      plateNumber: parsed.data.plateNumber || null,
      capacityWeightLbs: parsed.data.capacityWeightLbs || null,
      status: parsed.data.status,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "vehicle.created",
    entityType: "vehicles",
    entityId: vehicle.id,
    after: { equipmentType: vehicle.equipmentType, plateNumber: vehicle.plateNumber },
  });

  revalidatePath("/carrier/vehicles");
  return {};
}

export async function updateVehicleStatus(vehicleId: string, status: "active" | "maintenance" | "inactive"): Promise<VehicleActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "companies:read:own", user.companyId);

  const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.carrierId !== user.companyId) return { error: "Vehicle not found." };

  await db.vehicle.update({ where: { id: vehicleId }, data: { status } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "vehicle.status_changed",
    entityType: "vehicles",
    entityId: vehicleId,
    before: { status: vehicle.status },
    after: { status },
  });

  revalidatePath("/carrier/vehicles");
  return {};
}
