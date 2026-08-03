"use client";

import { useState, useTransition } from "react";
import { updateDriverStatus } from "./actions";
import type { DriverStatus } from "@/lib/generated/prisma/client";

export function DriverStatusSelect({ driverId, status }: { driverId: string; status: DriverStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: DriverStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateDriverStatus(driverId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as DriverStatus)}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
