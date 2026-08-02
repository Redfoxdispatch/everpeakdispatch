"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateLoadStatus, cancelLoad } from "../actions";
import type { LoadStatus } from "@/lib/generated/prisma/client";

const FORWARD_STATUS: Partial<Record<LoadStatus, LoadStatus>> = {
  draft: "quote_requested",
  quote_requested: "quoted",
  quoted: "booked",
  booked: "carrier_sourcing",
  carrier_sourcing: "dispatched",
  dispatched: "at_pickup",
  at_pickup: "picked_up",
  picked_up: "in_transit",
  in_transit: "at_delivery",
  at_delivery: "delivered",
  delivered: "completed",
  completed: "invoiced",
  invoiced: "paid",
  paid: "closed",
};

const CANCELLABLE_STATUSES = new Set<LoadStatus>([
  "draft",
  "quote_requested",
  "quoted",
  "booked",
  "carrier_sourcing",
  "dispatched",
  "at_pickup",
  "picked_up",
  "on_hold",
]);

export function StatusControls({ loadId, status }: { loadId: string; status: LoadStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  const next = FORWARD_STATUS[status];

  function advance() {
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const result = await updateLoadStatus(loadId, next);
      if (result.error) setError(result.error);
    });
  }

  function putOnHold() {
    setError(null);
    startTransition(async () => {
      const result = await updateLoadStatus(loadId, "on_hold");
      if (result.error) setError(result.error);
    });
  }

  function confirmCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelLoad(loadId, reason);
      if (result.error) setError(result.error);
      else setCancelling(false);
    });
  }

  if (cancelling) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <label className="text-xs font-medium text-muted-foreground">Cancellation reason</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
          placeholder="Why is this load being cancelled?"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={pending || !reason.trim()} onClick={confirmCancel}>
            {pending ? "Cancelling..." : "Confirm cancellation"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>
            Back
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next ? (
        <Button size="sm" disabled={pending} onClick={advance}>
          {pending ? "Updating..." : `Advance to ${next.replace(/_/g, " ")}`}
        </Button>
      ) : null}
      {status !== "on_hold" && status !== "cancelled" && status !== "closed" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={putOnHold}>
          Put on hold
        </Button>
      ) : null}
      {CANCELLABLE_STATUSES.has(status) ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setCancelling(true)}>
          Cancel load
        </Button>
      ) : null}
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
