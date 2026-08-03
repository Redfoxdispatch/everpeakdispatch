"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/permissions/can";
import { writeAuditLog } from "@/lib/audit/log";
import { generateInvoiceNumber } from "@/lib/invoices/generate-invoice-number";
import { recordPaymentSchema } from "@/lib/validations/invoice";
import type { InvoiceType } from "@/lib/generated/prisma/client";

export type InvoiceActionState = { error?: string };

const INVOICEABLE_STATUSES = new Set(["completed", "invoiced"]);

/**
 * Issues a shipper invoice or carrier settlement for a load — gated by the
 * hard rule in context/01-business-workflow.md §4.5: "No POD → block
 * invoice generation, full stop. This must be a server-side, enforced
 * rule, not just a UI warning." Enforced below, not just hinted at in the UI.
 */
export async function issueInvoice(loadId: string, type: InvoiceType): Promise<InvoiceActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertPermission(user, "invoices:issue");

  const load = await db.load.findUnique({
    where: { id: loadId },
    include: {
      acceptedQuote: { select: { sellRate: true } },
      carrierAssignments: { where: { status: "accepted" }, select: { carrierRate: true, carrierCompanyId: true } },
    },
  });
  if (!load || load.deletedAt) return { error: "Load not found." };
  if (!INVOICEABLE_STATUSES.has(load.status)) {
    return { error: `A ${load.status} load cannot be invoiced yet — it must be completed first.` };
  }

  const approvedPod = await db.document.findFirst({
    where: { loadId, documentType: "pod", status: "approved" },
  });
  if (!approvedPod) {
    return { error: "Cannot invoice — no approved Proof of Delivery on file for this load." };
  }

  const existing = await db.invoice.findFirst({ where: { loadId, type } });
  if (existing) {
    return { error: `A ${type === "shipper_invoice" ? "shipper invoice" : "carrier settlement"} already exists for this load.` };
  }

  let companyId: string;
  let rate: number;
  let dueInDays: number;

  if (type === "shipper_invoice") {
    if (!load.acceptedQuote) return { error: "This load has no accepted quote to bill from." };
    companyId = load.shipperCompanyId;
    rate = Number(load.acceptedQuote.sellRate);
    const shipperProfile = await db.shipperProfile.findUnique({ where: { companyId } });
    dueInDays = shipperProfile?.paymentTermsDays ?? 30;
  } else {
    const acceptedAssignment = load.carrierAssignments[0];
    if (!acceptedAssignment) return { error: "This load has no accepted carrier to settle with." };
    companyId = acceptedAssignment.carrierCompanyId;
    rate = Number(acceptedAssignment.carrierRate);
    dueInDays = 15; // carrier settlements aren't modeled with their own payment-terms field
  }

  const invoiceNumber = await generateInvoiceNumber(type);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  const invoice = await db.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        loadId,
        invoiceNumber,
        type,
        companyId,
        subtotal: rate,
        totalAmount: rate,
        dueDate,
        status: "sent",
        issuedAt: new Date(),
        lineItems: {
          create: [{ description: "Base linehaul rate", accessorialType: "base_rate", amount: rate }],
        },
      },
    });
    if (type === "shipper_invoice" && load.status === "completed") {
      await tx.load.update({ where: { id: loadId }, data: { status: "invoiced" } });
      await tx.trackingEvent.create({
        data: { loadId, eventType: "status_change", status: "invoiced", source: "manual", createdBy: user.id },
      });
    }
    return created;
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: type === "shipper_invoice" ? "invoice.issued" : "settlement.issued",
    entityType: "invoices",
    entityId: invoice.id,
    after: { loadId, invoiceNumber, totalAmount: rate },
  });

  revalidatePath(`/ops/loads/${loadId}`);
  revalidatePath("/ops/invoices");
  return {};
}

export async function recordPayment(_prevState: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
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

  const invoice = await db.invoice.findUnique({ where: { id: parsed.data.invoiceId } });
  if (!invoice) return { error: "Invoice not found." };
  if (["paid", "void"].includes(invoice.status)) {
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
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: newAmountPaid, status: newStatus },
    });
    if (invoice.type === "shipper_invoice" && newStatus === "paid") {
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

  revalidatePath(`/ops/loads/${invoice.loadId}`);
  revalidatePath("/ops/invoices");
  return {};
}
