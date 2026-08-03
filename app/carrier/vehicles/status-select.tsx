"use client";

import { useState, useTransition } from "react";
import { updateVehicleStatus } from "./actions";
import type { VehicleStatus } from "@/lib/generated/prisma/client";

export function VehicleStatusSelect({ vehicleId, status }: { vehicleId: string; status: VehicleStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: VehicleStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateVehicleStatus(vehicleId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as VehicleStatus)}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        <option value="active">Active</option>
        <option value="maintenance">Maintenance</option>
        <option value="inactive">Inactive</option>
      </select>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
