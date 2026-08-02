"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ApprovalResult } from "@/lib/companies/approval";

function ApproveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Approving..." : "Approve"}
    </Button>
  );
}

function RejectSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={pending}>
      {pending ? "Rejecting..." : "Confirm"}
    </Button>
  );
}

/** Approve/reject controls for a pending company row — shared by the Shippers and Carriers directory pages. */
export function ApproveRejectActions({
  companyId,
  approveAction,
  rejectAction,
}: {
  companyId: string;
  approveAction: (companyId: string) => Promise<ApprovalResult>;
  rejectAction: (companyId: string, reason: string) => Promise<ApprovalResult>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [approveState, approveFormAction] = useActionState<ApprovalResult, FormData>(
    () => approveAction(companyId),
    {},
  );
  const [rejectState, rejectFormAction] = useActionState<ApprovalResult, FormData>(
    (_prev, formData) => rejectAction(companyId, String(formData.get("reason") ?? "")),
    {},
  );

  if (rejecting) {
    return (
      <form action={rejectFormAction} className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            name="reason"
            placeholder="Reason (optional)"
            className="h-7 w-36 rounded-md border px-2 text-xs outline-none focus:border-ring"
          />
          <RejectSubmit />
          <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
        {rejectState.error ? <span className="text-xs text-destructive">{rejectState.error}</span> : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <form action={approveFormAction}>
          <ApproveSubmit />
        </form>
        <Button type="button" size="sm" variant="outline" onClick={() => setRejecting(true)}>
          Reject
        </Button>
      </div>
      {approveState.error ? <span className="text-xs text-destructive">{approveState.error}</span> : null}
    </div>
  );
}
