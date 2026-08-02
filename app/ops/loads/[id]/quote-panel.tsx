"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { QUOTE_STATUS_META } from "@/lib/status";
import { createQuote, recordQuoteAcceptance, recordQuoteRejection, type QuoteActionState } from "./quote-actions";

type QuoteRow = {
  id: string;
  version: number;
  sellRate: number;
  currency: string;
  validUntil: string;
  status: "pending" | "accepted" | "rejected" | "countered" | "expired";
  notes: string | null;
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function QuoteRowActions({ loadId, quote }: { loadId: string; quote: QuoteRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (quote.status !== "pending") return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await recordQuoteAcceptance(loadId, quote.id);
            if (result.error) setError(result.error);
          })
        }
      >
        Record acceptance
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await recordQuoteRejection(loadId, quote.id, "");
            if (result.error) setError(result.error);
          })
        }
      >
        Record rejection
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

export function QuotePanel({ loadId, quotes, canQuote }: { loadId: string; quotes: QuoteRow[]; canQuote: boolean }) {
  const [showForm, setShowForm] = useState(quotes.length === 0);
  const [state, formAction] = useActionState<QuoteActionState, FormData>(createQuote, {});

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Quotes</h2>
        {canQuote ? (
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "New quote"}
          </Button>
        ) : null}
      </div>

      {quotes.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {quotes.map((q) => (
            <li key={q.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  v{q.version} — ${q.sellRate.toLocaleString()} {q.currency}
                </div>
                <StatusBadge meta={QUOTE_STATUS_META[q.status]} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Valid until {new Date(q.validUntil).toLocaleString()}
              </div>
              {q.notes ? <div className="mt-1 text-xs">{q.notes}</div> : null}
              <QuoteRowActions loadId={loadId} quote={q} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No quotes yet.</p>
      )}

      {canQuote && showForm ? (
        <form action={formAction} className="mt-4 space-y-3 border-t pt-4">
          <input type="hidden" name="loadId" value={loadId} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Sell rate (USD)</label>
            <input type="number" name="sellRate" min={0} step="0.01" required className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Valid until</label>
            <input type="datetime-local" name="validUntil" required className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea name="notes" rows={2} className={`mt-1 ${inputClass} resize-none`} />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <SubmitButton label="Create quote" pendingLabel="Creating..." />
        </form>
      ) : null}
    </div>
  );
}
