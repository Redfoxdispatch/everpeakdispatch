"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ASSIGNMENT_STATUS_META } from "@/lib/status";
import { offerToCarrier, recordAssignmentResponse, markFellOff, type AssignmentActionState } from "./assignment-actions";

type AssignmentRow = {
  id: string;
  carrierName: string;
  carrierRate: number;
  status: "offered" | "accepted" | "declined" | "fell_off" | "cancelled";
  fellOffReason: string | null;
};

type EligibleCarrier = { id: string; name: string };

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

function AssignmentRowActions({ loadId, assignment }: { loadId: string; assignment: AssignmentRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fallingOff, setFallingOff] = useState(false);
  const [reason, setReason] = useState("");

  if (assignment.status === "offered") {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await recordAssignmentResponse(loadId, assignment.id, true);
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
              const result = await recordAssignmentResponse(loadId, assignment.id, false);
              if (result.error) setError(result.error);
            })
          }
        >
          Record decline
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    );
  }

  if (assignment.status === "accepted") {
    if (fallingOff) {
      return (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="h-7 w-40 rounded-md border px-2 text-xs"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await markFellOff(loadId, assignment.id, reason);
                if (result.error) setError(result.error);
                else setFallingOff(false);
              })
            }
          >
            Confirm fell off
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFallingOff(false)}>
            Cancel
          </Button>
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </div>
      );
    }
    return (
      <div className="mt-2">
        <Button size="sm" variant="outline" onClick={() => setFallingOff(true)}>
          Mark fell off
        </Button>
      </div>
    );
  }

  return null;
}

export function AssignmentPanel({
  loadId,
  assignments,
  eligibleCarriers,
  canAssign,
}: {
  loadId: string;
  assignments: AssignmentRow[];
  eligibleCarriers: EligibleCarrier[];
  canAssign: boolean;
}) {
  const [showForm, setShowForm] = useState(assignments.length === 0);
  const [state, formAction] = useActionState<AssignmentActionState, FormData>(offerToCarrier, {});
  const hasAccepted = assignments.some((a) => a.status === "accepted");

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Carrier assignment</h2>
        {canAssign && !hasAccepted ? (
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Offer to carrier"}
          </Button>
        ) : null}
      </div>

      {assignments.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {assignments.map((a) => (
            <li key={a.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {a.carrierName} — ${a.carrierRate.toLocaleString()}
                </div>
                <StatusBadge meta={ASSIGNMENT_STATUS_META[a.status]} />
              </div>
              {a.fellOffReason ? <div className="mt-1 text-xs text-muted-foreground">{a.fellOffReason}</div> : null}
              <AssignmentRowActions loadId={loadId} assignment={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No carrier offers yet.</p>
      )}

      {canAssign && !hasAccepted && showForm ? (
        <form action={formAction} className="mt-4 space-y-3 border-t pt-4">
          <input type="hidden" name="loadId" value={loadId} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Carrier</label>
            <select name="carrierCompanyId" required className={`mt-1 ${inputClass}`} defaultValue="">
              <option value="" disabled>
                {eligibleCarriers.length === 0 ? "No eligible carriers" : "Select a carrier"}
              </option>
              {eligibleCarriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Carrier rate (USD)</label>
            <input type="number" name="carrierRate" min={0} step="0.01" required className={`mt-1 ${inputClass}`} />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <SubmitButton label="Send offer" pendingLabel="Sending..." />
        </form>
      ) : null}
    </div>
  );
}
