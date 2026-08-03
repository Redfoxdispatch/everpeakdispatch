"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateShipmentStatus, reportFellOff } from "../actions";
import type { LoadStatus } from "@/lib/generated/prisma/client";

const FORWARD_STATUS: Partial<Record<LoadStatus, LoadStatus>> = {
  dispatched: "at_pickup",
  at_pickup: "picked_up",
  picked_up: "in_transit",
  in_transit: "at_delivery",
  at_delivery: "delivered",
};

const FELL_OFF_ELIGIBLE = new Set<LoadStatus>(["dispatched", "at_pickup"]);

export function CarrierStatusControls({
  loadId,
  assignmentId,
  status,
}: {
  loadId: string;
  assignmentId: string;
  status: LoadStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallingOff, setFallingOff] = useState(false);
  const [reason, setReason] = useState("");

  const next = FORWARD_STATUS[status];

  function advance() {
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const result = await updateShipmentStatus(loadId, next);
      if (result.error) setError(result.error);
    });
  }

  function confirmFellOff() {
    setError(null);
    startTransition(async () => {
      const result = await reportFellOff(loadId, assignmentId, reason);
      if (result.error) setError(result.error);
      else setFallingOff(false);
    });
  }

  if (fallingOff) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <label className="text-xs font-medium text-muted-foreground">Reason you can no longer haul this load</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={pending || !reason.trim()} onClick={confirmFellOff}>
            {pending ? "Submitting..." : "Confirm fell off"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFallingOff(false)}>
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
      {FELL_OFF_ELIGIBLE.has(status) ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setFallingOff(true)}>
          Report fell off
        </Button>
      ) : null}
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
