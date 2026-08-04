"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { notifyUser } from "@/lib/notifications/create";

export type QuoteResponseState = { error?: string };

/**
 * `quotes:accept`/`quotes:reject`/`quotes:counter` carry no `:own` suffix
 * (see lib/permissions/constants.ts), so assertPermission's built-in scope
 * check does nothing here — each action below manually verifies the load
 * belongs to the actor's own shipper company before mutating anything, per
 * the warning left in app/ops/loads/[id]/quote-actions.ts.
 */
async function loadOwnedQuote(loadId: string, quoteId: string, companyId: string | null) {
  const [load, quote] = await Promise.all([
    db.load.findUnique({ where: { id: loadId } }),
    db.quote.findUnique({ where: { id: quoteId } }),
  ]);
  if (!load || load.deletedAt) return { error: "Shipment not found." } as const;
  if (load.shipperCompanyId !== companyId) return { error: "Shipment not found." } as const;
  if (!quote || quote.loadId !== loadId) return { error: "Quote not found." } as const;
  return { load, quote } as const;
}

export async function acceptQuote(loadId: string, quoteId: string): Promise<QuoteResponseState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "quotes:accept");

  const result = await loadOwnedQuote(loadId, quoteId, user.companyId);
  if ("error" in result) return result;
  const { load, quote } = result;

  if (quote.status !== "pending") return { error: "Only a pending quote can be accepted." };
  if (quote.validUntil < new Date()) return { error: "This quote has expired — request a new one." };
  if (load.status !== "quoted") return { error: `Cannot book a ${load.status} shipment.` };

  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "accepted" } });
    await tx.booking.create({ data: { loadId, quoteId, confirmedRate: quote.sellRate, bookedBy: user.id } });
    await tx.load.update({ where: { id: loadId }, data: { status: "booked", acceptedQuoteId: quoteId } });
    await tx.trackingEvent.create({
      data: { loadId, eventType: "status_change", status: "booked", source: "manual", createdBy: user.id },
    });
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "quote.accepted",
    entityType: "quotes",
    entityId: quoteId,
    before: { status: "pending" },
    after: { status: "accepted", loadStatus: "booked" },
  });

  await notifyUser(load.createdBy, {
    type: "quote_accepted",
    title: `Quote accepted for ${load.loadNumber}`,
    body: `The shipper accepted — book a carrier.`,
    link: `/ops/loads/${loadId}`,
  });

  revalidatePath(`/shipper/shipments/${loadId}`);
  revalidatePath("/shipper/quotes");
  revalidatePath("/shipper/shipments");
  revalidatePath("/shipper/dashboard");
  return {};
}

export async function rejectQuote(loadId: string, quoteId: string, reason: string): Promise<QuoteResponseState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "quotes:reject");

  const result = await loadOwnedQuote(loadId, quoteId, user.companyId);
  if ("error" in result) return result;
  const { load, quote } = result;

  if (quote.status !== "pending") return { error: "Only a pending quote can be rejected." };

  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "rejected" } });
    if (load.status === "quoted") {
      await tx.load.update({ where: { id: loadId }, data: { status: "quote_requested" } });
      await tx.trackingEvent.create({
        data: {
          loadId,
          eventType: "status_change",
          status: "quote_requested",
          description: reason || "Quote rejected by shipper",
          source: "manual",
          createdBy: user.id,
        },
      });
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "quote.rejected",
    entityType: "quotes",
    entityId: quoteId,
    before: { status: "pending" },
    after: { status: "rejected", reason: reason || null },
  });

  revalidatePath(`/shipper/shipments/${loadId}`);
  revalidatePath("/shipper/quotes");
  return {};
}

export async function counterQuote(loadId: string, quoteId: string, counterRate: number, note: string): Promise<QuoteResponseState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "quotes:counter");

  if (!(counterRate > 0)) return { error: "Enter a counter rate greater than 0." };

  const result = await loadOwnedQuote(loadId, quoteId, user.companyId);
  if ("error" in result) return result;
  const { load, quote } = result;

  if (quote.status !== "pending") return { error: "Only a pending quote can be countered." };

  const counterNote = `[Shipper counter-offer] Requested rate: $${counterRate.toLocaleString()}.${note ? ` Note: ${note}` : ""}`;

  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "countered", notes: counterNote } });
    if (load.status === "quoted") {
      await tx.load.update({ where: { id: loadId }, data: { status: "quote_requested" } });
      await tx.trackingEvent.create({
        data: {
          loadId,
          eventType: "status_change",
          status: "quote_requested",
          description: counterNote,
          source: "manual",
          createdBy: user.id,
        },
      });
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "quote.countered",
    entityType: "quotes",
    entityId: quoteId,
    before: { status: "pending" },
    after: { status: "countered", counterRate },
  });

  revalidatePath(`/shipper/shipments/${loadId}`);
  revalidatePath("/shipper/quotes");
  return {};
}
