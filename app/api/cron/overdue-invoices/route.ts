import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { isAuthorizedCronRequest } from "@/lib/cron/verify";
import { notifyCompany, notifyUser } from "@/lib/notifications/create";

/** context/04-application-architecture.md §7: daily sweep, invoices past due_date and still unpaid → overdue. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdueInvoices = await db.invoice.findMany({
    where: { status: { in: ["sent", "partially_paid"] }, dueDate: { lt: new Date() } },
    include: { load: { select: { id: true, loadNumber: true, createdBy: true } } },
  });

  for (const invoice of overdueInvoices) {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "overdue" } });
    const label = invoice.type === "shipper_invoice" ? "shipper invoice" : "carrier settlement";
    await notifyCompany(invoice.companyId, {
      type: "invoice_overdue",
      title: `Invoice ${invoice.invoiceNumber} is overdue`,
      body: `${invoice.invoiceNumber} for ${invoice.load.loadNumber} was due and remains unpaid.`,
      link: `/ops/loads/${invoice.load.id}`,
    });
    await notifyUser(invoice.load.createdBy, {
      type: "invoice_overdue",
      title: `${label} overdue: ${invoice.invoiceNumber}`,
      body: `${invoice.load.loadNumber} — follow up on payment.`,
      link: `/ops/loads/${invoice.load.id}`,
    });
  }

  return NextResponse.json({ overdue: overdueInvoices.length });
}
