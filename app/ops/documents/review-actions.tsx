"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveDocument, rejectDocument } from "./actions";

export function DocumentReviewActions({ documentId }: { documentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="h-7 w-36 rounded-md border px-2 text-xs"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await rejectDocument(documentId, reason);
                if (result.error) setError(result.error);
                else setRejecting(false);
              })
            }
          >
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await approveDocument(documentId);
              if (result.error) setError(result.error);
            })
          }
        >
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
          Reject
        </Button>
      </div>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
