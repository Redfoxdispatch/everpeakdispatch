"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { generateLoadNumber } from "@/lib/loads/generate-load-number";
import { createLoadSchema, cancelLoadSchema } from "@/lib/validations/load";
import type { LoadStatus } from "@/lib/generated/prisma/client";

export type CreateLoadState = { error?: string };

export async function createLoad(_prevState: CreateLoadState, formData: FormData): Promise<CreateLoadState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "loads:create");

  let stops: unknown;
  try {
    stops = JSON.parse(String(formData.get("stopsJson") ?? "[]"));
  } catch {
    return { error: "Could not read stop details. Please try again." };
  }

  const parsed = createLoadSchema.safeParse({
    shipperCompanyId: formData.get("shipperCompanyId"),
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

  const shipper = await db.company.findUnique({ where: { id: parsed.data.shipperCompanyId } });
  if (!shipper || shipper.type !== "shipper" || shipper.status !== "active") {
    return { error: "Select an active shipper company." };
  }

  const equipment = await db.equipmentType.findUnique({ where: { code: parsed.data.equipmentType } });
  if (!equipment || !equipment.active) {
    return { error: "Select a valid equipment type." };
  }

  const loadNumber = await generateLoadNumber();

  const load = await db.load.create({
    data: {
      loadNumber,
      shipperCompanyId: parsed.data.shipperCompanyId,
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

  await writeAuditLog({
    actorUserId: user.id,
    action: "load.created",
    entityType: "loads",
    entityId: load.id,
    after: { loadNumber: load.loadNumber, shipperCompanyId: load.shipperCompanyId, status: load.status },
  });

  revalidatePath("/ops/loads");
  redirect(`/ops/loads/${load.id}`);
}

// Linear progression per context/01-business-workflow.md §2 status machine.
// `cancelled`/`on_hold` are handled as separate dedicated actions, not
// through this forward-progression list.
const STATUS_SEQUENCE: LoadStatus[] = [
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
];

function isValidForwardTransition(from: LoadStatus, to: LoadStatus): boolean {
  if (from === "on_hold") return true; // resuming from hold — permissive on purpose, ops judgment call
  const fromIndex = STATUS_SEQUENCE.indexOf(from);
  const toIndex = STATUS_SEQUENCE.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex === fromIndex + 1;
}

export async function updateLoadStatus(loadId: string, nextStatus: LoadStatus): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // NOTE for Phase 5 (Carrier Portal): this action is only reachable today
  // from the ops portal, where "all brokers manage all active loads" is the
  // documented MVP default (context/07-open-questions.md A4) — so the plain
  // role→permission check below is sufficient. A future carrier/driver-side
  // status update must NOT reuse this action as-is: assertPermission's
  // `:own` check compares `Load.shipperCompanyId`, which is meaningless for
  // a carrier — that caller needs its own explicit check that the load has
  // an `accepted` carrier_assignments row for the actor's company.
  await assertPermission(user, "loads:update:status");

  const load = await db.load.findUnique({ where: { id: loadId } });
  if (!load || load.deletedAt) return { error: "Load not found." };

  if (nextStatus === "on_hold") {
    if (["closed", "cancelled"].includes(load.status)) {
      return { error: `Cannot put a ${load.status} load on hold.` };
    }
  } else if (!isValidForwardTransition(load.status, nextStatus)) {
    return { error: `Cannot move a ${load.status} load directly to ${nextStatus}.` };
  }

  await db.load.update({ where: { id: loadId }, data: { status: nextStatus } });
  await writeAuditLog({
    actorUserId: user.id,
    action: "load.status_changed",
    entityType: "loads",
    entityId: loadId,
    before: { status: load.status },
    after: { status: nextStatus },
  });

  revalidatePath(`/ops/loads/${loadId}`);
  revalidatePath("/ops/loads");
  return {};
}

export async function cancelLoad(loadId: string, reason: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "loads:cancel");

  const parsed = cancelLoadSchema.safeParse({ loadId, reason });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "A cancellation reason is required." };
  }

  const load = await db.load.findUnique({ where: { id: loadId } });
  if (!load || load.deletedAt) return { error: "Load not found." };
  if (["in_transit", "at_delivery", "delivered", "completed", "invoiced", "paid", "closed", "cancelled"].includes(load.status)) {
    return { error: `A ${load.status} load cannot be cancelled — see context/01-business-workflow.md §4.1 for the in-transit exception workflow.` };
  }

  await db.load.update({
    where: { id: loadId },
    data: { status: "cancelled", cancelledReason: parsed.data.reason, cancelledAt: new Date() },
  });
  await writeAuditLog({
    actorUserId: user.id,
    action: "load.cancelled",
    entityType: "loads",
    entityId: loadId,
    before: { status: load.status },
    after: { status: "cancelled", reason: parsed.data.reason },
  });

  revalidatePath(`/ops/loads/${loadId}`);
  revalidatePath("/ops/loads");
  return {};
}
