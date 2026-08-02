"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { createQuoteSchema } from "@/lib/validations/quote";

export type QuoteActionState = { error?: string };

const QUOTABLE_STATUSES = new Set(["draft", "quote_requested", "quoted"]);

export async function createQuote(_prevState: QuoteActionState, formData: FormData): Promise<QuoteActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "quotes:create");

  const parsed = createQuoteSchema.safeParse({
    loadId: formData.get("loadId"),
    sellRate: formData.get("sellRate"),
    validUntil: formData.get("validUntil"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const load = await db.load.findUnique({ where: { id: parsed.data.loadId } });
  if (!load || load.deletedAt) return { error: "Load not found." };
  if (!QUOTABLE_STATUSES.has(load.status)) {
    return { error: `A ${load.status} load cannot be quoted.` };
  }

  const latestQuote = await db.quote.findFirst({
    where: { loadId: load.id },
    orderBy: { version: "desc" },
  });

  const quote = await db.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        loadId: load.id,
        version: (latestQuote?.version ?? 0) + 1,
        previousQuoteId: latestQuote?.id ?? null,
        sellRate: parsed.data.sellRate,
        validUntil: new Date(parsed.data.validUntil),
        notes: parsed.data.notes || null,
        createdBy: user.id,
      },
    });
    if (load.status !== "quoted") {
      await tx.load.update({ where: { id: load.id }, data: { status: "quoted" } });
    }
    return created;
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "quote.created",
    entityType: "quotes",
    entityId: quote.id,
    after: { loadId: load.id, sellRate: parsed.data.sellRate, version: quote.version },
  });

  revalidatePath(`/ops/loads/${load.id}`);
  return {};
}

/**
 * The shipper's own accept/reject/counter (quotes:accept etc., see
 * context/02-rbac-roles-permissions.md §3) is Phase 4 (shipper self-
 * service) scope, which doesn't exist yet. Phase 3's exit criterion still
 * requires a broker to drive the full quote → book flow end-to-end using
 * seeded data — this records a broker-side "the shipper accepted by phone/
 * email" action, gated by the broker's own quotes:create + loads:update:status
 * permissions rather than the shipper's quotes:accept, since it's a
 * distinct action (recording an off-system decision) even though the net
 * data effect looks similar. Phase 4's real shipper accept button should
 * NOT reuse this action as-is — it needs its own :own-scoped ownership
 * check against the shipper's company.
 */
export async function recordQuoteAcceptance(loadId: string, quoteId: string): Promise<QuoteActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "quotes:create");
  await assertPermission(user, "loads:update:status");

  const [load, quote] = await Promise.all([
    db.load.findUnique({ where: { id: loadId } }),
    db.quote.findUnique({ where: { id: quoteId } }),
  ]);
  if (!load || load.deletedAt) return { error: "Load not found." };
  if (!quote || quote.loadId !== loadId) return { error: "Quote not found." };
  if (quote.status !== "pending") return { error: "Only a pending quote can be accepted." };
  if (quote.validUntil < new Date()) return { error: "This quote has expired — create a new one." };
  if (load.status !== "quoted") return { error: `Cannot book a ${load.status} load.` };

  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "accepted" } });
    await tx.booking.create({
      data: { loadId, quoteId, confirmedRate: quote.sellRate, bookedBy: user.id },
    });
    await tx.load.update({ where: { id: loadId }, data: { status: "booked", acceptedQuoteId: quoteId } });
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "quote.accepted",
    entityType: "quotes",
    entityId: quoteId,
    before: { status: "pending" },
    after: { status: "accepted", loadStatus: "booked" },
  });

  revalidatePath(`/ops/loads/${loadId}`);
  return {};
}

export async function recordQuoteRejection(loadId: string, quoteId: string, reason: string): Promise<QuoteActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "quotes:create");
  await assertPermission(user, "loads:update:status");

  const [load, quote] = await Promise.all([
    db.load.findUnique({ where: { id: loadId } }),
    db.quote.findUnique({ where: { id: quoteId } }),
  ]);
  if (!load || load.deletedAt) return { error: "Load not found." };
  if (!quote || quote.loadId !== loadId) return { error: "Quote not found." };
  if (quote.status !== "pending") return { error: "Only a pending quote can be rejected." };

  await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "rejected" } });
    if (load.status === "quoted") {
      await tx.load.update({ where: { id: loadId }, data: { status: "quote_requested" } });
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

  revalidatePath(`/ops/loads/${loadId}`);
  return {};
}
