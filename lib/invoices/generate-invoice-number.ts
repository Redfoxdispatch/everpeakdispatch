import "server-only";
import { db } from "@/lib/db/client";
import type { InvoiceType } from "@/lib/generated/prisma/client";

/** Same count-based-candidate-with-retry pattern as generate-load-number.ts. */
export async function generateInvoiceNumber(type: InvoiceType): Promise<string> {
  const prefix = type === "shipper_invoice" ? "INV" : "SET";
  const count = await db.invoice.count({ where: { type } });
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${prefix}-${String(count + 1 + attempt).padStart(6, "0")}`;
    const exists = await db.invoice.findUnique({ where: { invoiceNumber: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique invoice number after 5 attempts.");
}
