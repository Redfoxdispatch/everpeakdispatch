"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { INVOICE_STATUS_META } from "@/lib/status";
import { payShipperInvoice, disputeShipperInvoice, type InvoiceActionState } from "../../invoices/actions";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "disputed" | "void";
  disputeReason: string | null;
};

function PaySubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Recording..." : "Record payment"}
    </Button>
  );
}

function PayForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction] = useActionState<InvoiceActionState, FormData>(payShipperInvoice, {});
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
        <input
          type="number"
          name="amount"
          min={0}
          step="0.01"
          placeholder="Amount"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
        />
        <select
          name="method"
          required
          defaultValue="wire"
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
        >
          <option value="wire">Wire</option>
          <option value="ach">ACH</option>
          <option value="check">Check</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>
      </div>
      <input
        name="transactionRef"
        placeholder="Reference (optional)"
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
      />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <PaySubmit />
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DisputeAction({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Dispute
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border p-3">
      <label className="text-xs font-medium text-muted-foreground">Reason for dispute</label>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={pending || !reason.trim()}
          onClick={() =>
            startTransition(async () => {
              const result = await disputeShipperInvoice(invoiceId, reason);
              if (result.error) setError(result.error);
              else setOpen(false);
            })
          }
        >
          {pending ? "Submitting..." : "Submit dispute"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

export function InvoiceSection({ invoice }: { invoice: InvoiceRow | null }) {
  if (!invoice) {
    return (
      <div>
        <h2 className="text-sm font-semibold">Invoice</h2>
        <p className="mt-2 text-sm text-muted-foreground">Not yet issued — this happens once the shipment is completed.</p>
      </div>
    );
  }

  const canAct = invoice.status !== "paid" && invoice.status !== "void" && invoice.status !== "disputed";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Invoice</h2>
        <StatusBadge meta={INVOICE_STATUS_META[invoice.status]} />
      </div>
      <div className="mt-2 text-sm">
        {invoice.invoiceNumber} — ${invoice.totalAmount.toLocaleString()}
        {invoice.amountPaid > 0 ? ` ($${invoice.amountPaid.toLocaleString()} paid)` : ""}
      </div>
      <div className="text-xs text-muted-foreground">Due {new Date(invoice.dueDate).toLocaleDateString()}</div>
      {invoice.disputeReason ? <div className="mt-1 text-xs text-destructive">Dispute: {invoice.disputeReason}</div> : null}
      {canAct ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <PayForm invoiceId={invoice.id} />
          <DisputeAction invoiceId={invoice.id} />
        </div>
      ) : null}
    </div>
  );
}
