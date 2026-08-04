"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { notifyUser, notifyCompany } from "@/lib/notifications/create";
import type { LoadStatus } from "@/lib/generated/prisma/client";

export type CarrierActionState = { error?: string };

/**
 * `carrier_assignments:accept`/`:decline` carry no `:own` suffix, so —
 * mirroring the shipper actions and the warning left in
 * app/ops/loads/[id]/assignment-actions.ts — this must independently
 * verify the assignment belongs to the actor's own carrier company.
 */
export async function respondToOffer(loadId: string, assignmentId: string, accepted: boolean): Promise<CarrierActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, accepted ? "carrier_assignments:accept" : "carrier_assignments:decline");

  const assignment = await db.carrierAssignment.findUnique({ where: { id: assignmentId }, include: { load: true } });
  if (!assignment || assignment.loadId !== loadId || assignment.carrierCompanyId !== user.companyId) {
    return { error: "Offer not found." };
  }
  if (assignment.status !== "offered") return { error: "This offer has already been responded to." };

  if (accepted) {
    const alreadyAccepted = await db.carrierAssignment.findFirst({ where: { loadId, status: "accepted" } });
    if (alreadyAccepted) return { error: "This load has already been accepted by another carrier." };

    await db.$transaction(async (tx) => {
      await tx.carrierAssignment.update({ where: { id: assignmentId }, data: { status: "accepted", respondedAt: new Date() } });
      await tx.load.update({ where: { id: loadId }, data: { status: "dispatched" } });
      await tx.trackingEvent.create({
        data: { loadId, eventType: "status_change", status: "dispatched", source: "manual", createdBy: user.id },
      });
    });
  } else {
    await db.carrierAssignment.update({ where: { id: assignmentId }, data: { status: "declined", respondedAt: new Date() } });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: accepted ? "carrier_assignment.accepted" : "carrier_assignment.declined",
    entityType: "carrier_assignments",
    entityId: assignmentId,
    after: { status: accepted ? "accepted" : "declined" },
  });

  await notifyUser(assignment.load.createdBy, {
    type: accepted ? "carrier_accepted" : "carrier_declined",
    title: `${assignment.load.loadNumber}: carrier ${accepted ? "accepted" : "declined"} the offer`,
    link: `/ops/loads/${loadId}`,
  });

  revalidatePath("/carrier/loads/available");
  revalidatePath("/carrier/loads");
  revalidatePath("/carrier/dashboard");
  return {};
}

// Carrier-driven range only — dispatch onward is broker-initiated
// (recordAssignmentResponse already sets "dispatched"), and everything from
// "completed" onward requires broker/ops review (POD approval, invoicing),
// so it's deliberately excluded here.
const CARRIER_STATUS_SEQUENCE: LoadStatus[] = ["dispatched", "at_pickup", "picked_up", "in_transit", "at_delivery", "delivered"];

export async function updateShipmentStatus(loadId: string, nextStatus: LoadStatus): Promise<CarrierActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "loads:update:status");

  const [load, assignment] = await Promise.all([
    db.load.findUnique({ where: { id: loadId } }),
    db.carrierAssignment.findFirst({ where: { loadId, carrierCompanyId: user.companyId, status: "accepted" } }),
  ]);
  if (!load || load.deletedAt || !assignment) return { error: "Shipment not found." };

  const fromIndex = CARRIER_STATUS_SEQUENCE.indexOf(load.status);
  const toIndex = CARRIER_STATUS_SEQUENCE.indexOf(nextStatus);
  if (fromIndex === -1 || toIndex !== fromIndex + 1) {
    return { error: `Cannot move a ${load.status} shipment directly to ${nextStatus}.` };
  }

  await db.$transaction([
    db.load.update({ where: { id: loadId }, data: { status: nextStatus } }),
    db.trackingEvent.create({
      data: { loadId, eventType: "status_change", status: nextStatus, source: "manual", createdBy: user.id },
    }),
  ]);

  await writeAuditLog({
    actorUserId: user.id,
    action: "load.status_changed",
    entityType: "loads",
    entityId: loadId,
    before: { status: load.status },
    after: { status: nextStatus },
  });

  // context/01-business-workflow.md §5: only these two carrier-driven
  // transitions are notification-worthy — the intermediate ones
  // (at_pickup, in_transit, at_delivery) are visible on the tracking view
  // but aren't listed as a notification trigger.
  if (nextStatus === "picked_up" || nextStatus === "delivered") {
    const title = `${load.loadNumber} ${nextStatus === "picked_up" ? "picked up" : "delivered"}`;
    await Promise.all([
      notifyCompany(load.shipperCompanyId, { type: "status_change", title, link: `/shipper/shipments/${loadId}` }),
      notifyUser(load.createdBy, { type: "status_change", title, link: `/ops/loads/${loadId}` }),
    ]);
  }

  revalidatePath(`/carrier/loads/${loadId}`);
  revalidatePath("/carrier/loads");
  return {};
}

const FELL_OFF_ELIGIBLE_STATUSES = new Set(["dispatched", "at_pickup"]);

export async function reportFellOff(loadId: string, assignmentId: string, reason: string): Promise<CarrierActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "carrier_assignments:decline");

  if (!reason.trim()) return { error: "A reason is required." };

  const [load, assignment] = await Promise.all([
    db.load.findUnique({ where: { id: loadId } }),
    db.carrierAssignment.findUnique({ where: { id: assignmentId } }),
  ]);
  if (!load || !assignment || assignment.loadId !== loadId || assignment.carrierCompanyId !== user.companyId) {
    return { error: "Shipment not found." };
  }
  if (assignment.status !== "accepted") return { error: "Only an accepted assignment can fall off." };
  if (!FELL_OFF_ELIGIBLE_STATUSES.has(load.status)) {
    return { error: "Once picked up, contact your broker directly — this requires the return/reconsign workflow." };
  }

  await db.$transaction(async (tx) => {
    await tx.carrierAssignment.update({ where: { id: assignmentId }, data: { status: "fell_off", fellOffReason: reason } });
    await tx.load.update({ where: { id: loadId }, data: { status: "carrier_sourcing" } });
    await tx.trackingEvent.create({
      data: {
        loadId,
        eventType: "exception",
        status: "carrier_sourcing",
        description: `Carrier fell off: ${reason}`,
        source: "manual",
        createdBy: user.id,
      },
    });
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "carrier_assignment.fell_off",
    entityType: "carrier_assignments",
    entityId: assignmentId,
    after: { status: "fell_off", reason },
  });

  const title = `${load.loadNumber}: carrier fell off — ${reason}`;
  await Promise.all([
    notifyCompany(load.shipperCompanyId, { type: "exception", title, link: `/shipper/shipments/${loadId}` }),
    notifyUser(load.createdBy, { type: "exception", title, link: `/ops/loads/${loadId}` }),
  ]);

  revalidatePath(`/carrier/loads/${loadId}`);
  revalidatePath("/carrier/loads");
  return {};
}

/**
 * No dedicated permission key exists for "update my own assignment's
 * driver/vehicle" — it's a natural extension of having accepted the load,
 * not a distinct resource-action pair, so this reuses
 * `carrier_assignments:accept` as the umbrella permission and relies on the
 * explicit ownership + status checks below for the real authorization.
 */
export async function assignDriverVehicle(
  loadId: string,
  assignmentId: string,
  driverId: string | null,
  vehicleId: string | null,
): Promise<CarrierActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "carrier_assignments:accept");

  const assignment = await db.carrierAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment || assignment.loadId !== loadId || assignment.carrierCompanyId !== user.companyId) {
    return { error: "Shipment not found." };
  }
  if (assignment.status !== "accepted") return { error: "Only an accepted assignment can be staffed." };

  if (driverId) {
    const driver = await db.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.carrierId !== user.companyId) return { error: "Select a driver from your own roster." };
  }
  if (vehicleId) {
    const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.carrierId !== user.companyId) return { error: "Select a vehicle from your own fleet." };
  }

  await db.carrierAssignment.update({ where: { id: assignmentId }, data: { driverId, vehicleId } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "carrier_assignment.staffed",
    entityType: "carrier_assignments",
    entityId: assignmentId,
    after: { driverId, vehicleId },
  });

  revalidatePath(`/carrier/loads/${loadId}`);
  return {};
}
