"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respondToOffer } from "@/app/carrier/loads/actions";

export function OfferResponse({ loadId, assignmentId }: { loadId: string; assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(accepted: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await respondToOffer(loadId, assignmentId, accepted);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => respond(true)}>
        Accept
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => respond(false)}>
        Decline
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
