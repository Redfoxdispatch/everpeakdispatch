"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { recordPaymentSchema } from "@/lib/validations/invoice";

export type InvoiceActionState = { error?: string };

/**
 * `payments:record` carries no `:own` suffix, so — like the shipper quote
 * and document actions — this must independently verify the invoice
 * belongs to the actor's own company before touching it; otherwise any
 * shipper could record a payment against any company's invoice.
 */
async function loadOwnedInvoice(invoiceId: string, companyId: string | null) {
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.type !== "shipper_invoice" || invoice.companyId !== companyId) {
    return { error: "Invoice not found." } as const;
  }
  return { invoice } as const;
}

export async function payShipperInvoice(_prevState: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "payments:record");

  const parsed = recordPaymentSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    transactionRef: formData.get("transactionRef"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await loadOwnedInvoice(parsed.data.invoiceId, user.companyId);
  if ("error" in result) return result;
  const { invoice } = result;

  if (["paid", "void", "disputed"].includes(invoice.status)) {
    return { error: `This invoice is already ${invoice.status}.` };
  }

  const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  if (parsed.data.amount > remaining) {
    return { error: `Amount exceeds the remaining balance of $${remaining.toLocaleString()}.` };
  }

  const newAmountPaid = Number(invoice.amountPaid) + parsed.data.amount;
  const newStatus = newAmountPaid >= Number(invoice.totalAmount) ? "paid" : "partially_paid";

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        status: "completed",
        transactionRef: parsed.data.transactionRef || null,
        paidAt: new Date(),
      },
    });
    await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: newAmountPaid, status: newStatus } });
    if (newStatus === "paid") {
      const load = await tx.load.findUnique({ where: { id: invoice.loadId }, select: { status: true } });
      if (load?.status === "invoiced") {
        await tx.load.update({ where: { id: invoice.loadId }, data: { status: "paid" } });
        await tx.trackingEvent.create({
          data: { loadId: invoice.loadId, eventType: "status_change", status: "paid", source: "manual", createdBy: user.id },
        });
      }
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: "payment.recorded",
    entityType: "invoices",
    entityId: invoice.id,
    after: { amount: parsed.data.amount, method: parsed.data.method, newStatus },
  });

  revalidatePath(`/shipper/shipments/${invoice.loadId}`);
  revalidatePath("/shipper/invoices");
  return {};
}

export async function disputeShipperInvoice(invoiceId: string, reason: string): Promise<InvoiceActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "payments:record");

  if (!reason.trim()) return { error: "A reason is required to dispute an invoice." };

  const result = await loadOwnedInvoice(invoiceId, user.companyId);
  if ("error" in result) return result;
  const { invoice } = result;

  if (["paid", "void", "disputed"].includes(invoice.status)) {
    return { error: `This invoice is already ${invoice.status}.` };
  }

  await db.invoice.update({ where: { id: invoice.id }, data: { status: "disputed", disputeReason: reason.trim() } });

  await writeAuditLog({
    actorUserId: user.id,
    action: "invoice.disputed",
    entityType: "invoices",
    entityId: invoice.id,
    before: { status: invoice.status },
    after: { status: "disputed", reason: reason.trim() },
  });

  revalidatePath(`/shipper/shipments/${invoice.loadId}`);
  revalidatePath("/shipper/invoices");
  return {};
}
