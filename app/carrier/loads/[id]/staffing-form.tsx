"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { assignDriverVehicle } from "../actions";

type Driver = { id: string; fullName: string };
type Vehicle = { id: string; plateNumber: string | null; equipmentType: string };

export function StaffingForm({
  loadId,
  assignmentId,
  drivers,
  vehicles,
  currentDriverId,
  currentVehicleId,
}: {
  loadId: string;
  assignmentId: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  currentDriverId: string | null;
  currentVehicleId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState(currentDriverId ?? "");
  const [vehicleId, setVehicleId] = useState(currentVehicleId ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await assignDriverVehicle(loadId, assignmentId, driverId || null, vehicleId || null);
      if (result.error) setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Driver</label>
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={`mt-1 ${inputClass}`}>
          <option value="">Unassigned</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Vehicle</label>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={`mt-1 ${inputClass}`}>
          <option value="">Unassigned</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber ?? v.equipmentType} ({v.equipmentType.replace("_", " ")})
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button size="sm" disabled={pending} onClick={save}>
        {pending ? "Saving..." : "Save assignment"}
      </Button>
    </div>
  );
}
