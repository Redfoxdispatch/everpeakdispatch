"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { notifyCompany } from "@/lib/notifications/create";
import { offerToCarrierSchema } from "@/lib/validations/carrier-assignment";

export type AssignmentActionState = { error?: string };

export async function offerToCarrier(_prevState: AssignmentActionState, formData: FormData): Promise<AssignmentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "carrier_assignments:create");

  const parsed = offerToCarrierSchema.safeParse({
    loadId: formData.get("loadId"),
    carrierCompanyId: formData.get("carrierCompanyId"),
    carrierRate: formData.get("carrierRate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const load = await db.load.findUnique({ where: { id: parsed.data.loadId } });
  if (!load || load.deletedAt) return { error: "Load not found." };
  if (!["booked", "carrier_sourcing"].includes(load.status)) {
    return { error: `Cannot offer a ${load.status} load to a carrier.` };
  }

  const carrier = await db.company.findUnique({
    where: { id: parsed.data.carrierCompanyId },
    include: { carrierProfile: true },
  });
  if (!carrier || carrier.type !== "carrier" || carrier.status !== "active" || !carrier.carrierProfile) {
    return { error: "Select an active carrier company." };
  }
  // Hard compliance gate — context/01-business-workflow.md §4.7: an
  // uninsured/non-active-authority carrier must be automatically excluded
  // from new load offers, not just flagged.
  if (carrier.carrierProfile.authorityStatus !== "active") {
    return { error: "This carrier's operating authority is not active." };
  }
  if (carrier.carrierProfile.insuranceExpiryDate < new Date()) {
    return { error: "This carrier's insurance has expired." };
  }

  const existingOffer = await db.carrierAssignment.findFirst({
    where: { loadId: load.id, carrierCompanyId: carrier.id, status: "offered" },
  });
  if (existingOffer) return { error: "This carrier already has a pending offer on this load." };

  await db.$transaction(async (tx) => {
    await tx.carrierAssignment.create({
      data: {
        loadId: load.id,
        carrierCompanyId: carrier.id,
        carrierRate: parsed.data.carrierRate,
        offeredBy: user.id,
      },
    });
    if (load.status === "booked") {
      await tx.load.update({ where: { id: load.id }, data: { status: "carrier_sourcing" } });
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "carrier_assignment.offered",
    entityType: "carrier_assignments",
    entityId: load.id,
    after: { loadId: load.id, carrierCompanyId: carrier.id, carrierRate: parsed.data.carrierRate },
  });

  await notifyCompany(carrier.id, {
    type: "load_offered",
    title: `New load offer: ${load.loadNumber}`,
    body: `$${Number(parsed.data.carrierRate).toLocaleString()} — review on your Available Loads board.`,
    link: "/carrier/loads/available",
  });

  revalidatePath(`/ops/loads/${load.id}`);
  return {};
}

/**
 * Same reasoning as recordQuoteAcceptance in quote-actions.ts: the
 * carrier's own accept/decline (carrier_assignments:accept/:decline) is
 * Phase 5 (Carrier Portal) scope. This records a broker-side "the carrier
 * responded by phone" action on the broker's own carrier_assignments:create
 * + loads:update:status authority.
 */
export async function recordAssignmentResponse(
  loadId: string,
  assignmentId: string,
  accepted: boolean,
): Promise<AssignmentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "carrier_assignments:create");
  await assertPermission(user, "loads:update:status");

  const assignment = await db.carrierAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment || assignment.loadId !== loadId) return { error: "Offer not found." };
  if (assignment.status !== "offered") return { error: "This offer has already been responded to." };

  if (accepted) {
    const alreadyAccepted = await db.carrierAssignment.findFirst({
      where: { loadId, status: "accepted" },
    });
    if (alreadyAccepted) return { error: "This load already has an accepted carrier." };

    await db.$transaction(async (tx) => {
      await tx.carrierAssignment.update({
        where: { id: assignmentId },
        data: { status: "accepted", respondedAt: new Date() },
      });
      await tx.load.update({ where: { id: loadId }, data: { status: "dispatched" } });
    });
  } else {
    await db.carrierAssignment.update({
      where: { id: assignmentId },
      data: { status: "declined", respondedAt: new Date() },
    });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: accepted ? "carrier_assignment.accepted" : "carrier_assignment.declined",
    entityType: "carrier_assignments",
    entityId: assignmentId,
    after: { status: accepted ? "accepted" : "declined" },
  });

  revalidatePath(`/ops/loads/${loadId}`);
  return {};
}

const FELL_OFF_ELIGIBLE_STATUSES = new Set(["dispatched", "at_pickup"]);

export async function markFellOff(loadId: string, assignmentId: string, reason: string): Promise<AssignmentActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "carrier_assignments:create");
  await assertPermission(user, "loads:update:status");

  if (!reason.trim()) return { error: "A reason is required." };

  const [load, assignment] = await Promise.all([
    db.load.findUnique({ where: { id: loadId } }),
    db.carrierAssignment.findUnique({ where: { id: assignmentId } }),
  ]);
  if (!load || !assignment || assignment.loadId !== loadId) return { error: "Not found." };
  if (assignment.status !== "accepted") return { error: "Only an accepted assignment can fall off." };
  if (!FELL_OFF_ELIGIBLE_STATUSES.has(load.status)) {
    return {
      error: "Once a load is past pickup, fallout requires the return/reconsign workflow — see context/01-business-workflow.md §4.1.",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.carrierAssignment.update({
      where: { id: assignmentId },
      data: { status: "fell_off", fellOffReason: reason },
    });
    await tx.load.update({ where: { id: loadId }, data: { status: "carrier_sourcing" } });
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "carrier_assignment.fell_off",
    entityType: "carrier_assignments",
    entityId: assignmentId,
    after: { status: "fell_off", reason },
  });

  revalidatePath(`/ops/loads/${loadId}`);
  return {};
}
