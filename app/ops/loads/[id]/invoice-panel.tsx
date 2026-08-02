"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { INVOICE_STATUS_META } from "@/lib/status";
import { issueInvoice, recordPayment, type InvoiceActionState } from "../../invoices/actions";
import type { InvoiceType } from "@/lib/generated/prisma/client";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  totalAmount: number;
  amountPaid: number;
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "disputed" | "void";
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function PaymentSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Recording..." : "Record payment"}
    </Button>
  );
}

function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction] = useActionState<InvoiceActionState, FormData>(recordPayment, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Record payment
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-md border p-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" name="amount" min={0} step="0.01" placeholder="Amount" required className={inputClass} />
        <select name="method" required className={inputClass} defaultValue="wire">
          <option value="wire">Wire</option>
          <option value="ach">ACH</option>
          <option value="check">Check</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>
      </div>
      <input name="transactionRef" placeholder="Reference (optional)" className={inputClass} />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <PaymentSubmit />
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function IssueButton({ loadId, type, label }: { loadId: string; type: InvoiceType; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await issueInvoice(loadId, type);
            if (result.error) setError(result.error);
          })
        }
      >
        {pending ? "Issuing..." : label}
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function InvoicePanel({
  loadId,
  invoices,
  canIssue,
  canRecordPayment,
}: {
  loadId: string;
  invoices: InvoiceRow[];
  canIssue: boolean;
  canRecordPayment: boolean;
}) {
  const shipperInvoice = invoices.find((i) => i.type === "shipper_invoice");
  const carrierSettlement = invoices.find((i) => i.type === "carrier_settlement");

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Invoicing</h2>

      <div className="mt-3 space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Shipper invoice</span>
            {shipperInvoice ? <StatusBadge meta={INVOICE_STATUS_META[shipperInvoice.status]} /> : null}
          </div>
          {shipperInvoice ? (
            <div className="mt-1">
              <div className="text-sm">
                {shipperInvoice.invoiceNumber} — ${shipperInvoice.totalAmount.toLocaleString()}
                {shipperInvoice.amountPaid > 0 ? ` ($${shipperInvoice.amountPaid.toLocaleString()} paid)` : ""}
              </div>
              {canRecordPayment && shipperInvoice.status !== "paid" && shipperInvoice.status !== "void" ? (
                <div className="mt-1">
                  <PaymentForm invoiceId={shipperInvoice.id} />
                </div>
              ) : null}
            </div>
          ) : canIssue ? (
            <div className="mt-1">
              <IssueButton loadId={loadId} type="shipper_invoice" label="Issue shipper invoice" />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Not yet issued.</p>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Carrier settlement</span>
            {carrierSettlement ? <StatusBadge meta={INVOICE_STATUS_META[carrierSettlement.status]} /> : null}
          </div>
          {carrierSettlement ? (
            <div className="mt-1">
              <div className="text-sm">
                {carrierSettlement.invoiceNumber} — ${carrierSettlement.totalAmount.toLocaleString()}
                {carrierSettlement.amountPaid > 0 ? ` ($${carrierSettlement.amountPaid.toLocaleString()} paid)` : ""}
              </div>
              {canRecordPayment && carrierSettlement.status !== "paid" && carrierSettlement.status !== "void" ? (
                <div className="mt-1">
                  <PaymentForm invoiceId={carrierSettlement.id} />
                </div>
              ) : null}
            </div>
          ) : canIssue ? (
            <div className="mt-1">
              <IssueButton loadId={loadId} type="carrier_settlement" label="Issue carrier settlement" />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Not yet issued.</p>
          )}
        </div>
      </div>
    </div>
  );
}
