"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { createDriverSchema } from "@/lib/validations/driver";

export type DriverActionState = { error?: string };

// See app/carrier/vehicles/actions.ts — same reasoning: no dedicated
// `drivers:*` permission key exists, so this is scoped by explicit
// `carrierId = user.companyId` ownership checks rather than a role permission.
export async function createDriver(_prevState: DriverActionState, formData: FormData): Promise<DriverActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "companies:read:own", user.companyId);

  const parsed = createDriverSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    licenseNumber: formData.get("licenseNumber"),
    licenseExpiry: formData.get("licenseExpiry"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const driver = await db.driver.create({
    data: {
      carrierId: user.companyId,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      licenseNumber: parsed.data.licenseNumber || null,
      licenseExpiry: parsed.data.licenseExpiry ? new Date(parsed.data.licenseExpiry) : null,
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "driver.created",
    entityType: "drivers",
    entityId: driver.id,
    after: { fullName: driver.fullName },
  });

  revalidatePath("/carrier/drivers");
  return {};
}

export async function updateDriverStatus(driverId: string, status: "active" | "inactive"): Promise<DriverActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "companies:read:own", user.companyId);

  const driver = await db.driver.findUnique({ where: { id: driverId } });
  if (!driver || driver.carrierId !== user.companyId) return { error: "Driver not found." };

  await db.driver.update({ where: { id: driverId }, data: { status } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "driver.status_changed",
    entityType: "drivers",
    entityId: driverId,
    before: { status: driver.status },
    after: { status },
  });

  revalidatePath("/carrier/drivers");
  return {};
}
