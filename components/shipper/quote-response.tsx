"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptQuote, rejectQuote, counterQuote } from "@/app/shipper/quotes/actions";

type Quote = {
  id: string;
  loadId: string;
  version: number;
  sellRate: number;
  currency: string;
  validUntil: string;
  status: "pending" | "accepted" | "rejected" | "countered" | "expired";
};

export function QuoteResponse({ quote }: { quote: Quote }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [countering, setCountering] = useState(false);
  const [counterRate, setCounterRate] = useState("");
  const [note, setNote] = useState("");

  const expired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;
  if (quote.status !== "pending" || expired) return null;

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptQuote(quote.loadId, quote.id);
      if (result.error) setError(result.error);
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectQuote(quote.loadId, quote.id, "");
      if (result.error) setError(result.error);
    });
  }

  function handleCounter() {
    setError(null);
    const rate = Number(counterRate);
    startTransition(async () => {
      const result = await counterQuote(quote.loadId, quote.id, rate, note);
      if (result.error) setError(result.error);
      else setCountering(false);
    });
  }

  if (countering) {
    return (
      <div className="mt-2 flex flex-col gap-2 rounded-md border p-3">
        <label className="text-xs font-medium text-muted-foreground">Your counter rate (USD)</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={counterRate}
          onChange={(e) => setCounterRate(e.target.value)}
          className="h-8 w-40 rounded-md border border-input bg-background px-2 text-sm"
        />
        <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          placeholder="Why you're countering"
        />
        <div className="flex gap-2">
          <Button size="sm" disabled={pending || !counterRate} onClick={handleCounter}>
            {pending ? "Sending..." : "Send counter-offer"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCountering(false)}>
            Cancel
          </Button>
        </div>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={pending} onClick={handleAccept}>
        Accept
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setCountering(true)}>
        Counter
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={handleReject}>
        Reject
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
