"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createVehicle, type VehicleActionState } from "./actions";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-medium text-muted-foreground";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding..." : "Add vehicle"}
    </Button>
  );
}

export function VehicleForm({ equipmentTypes }: { equipmentTypes: { code: string; label: string }[] }) {
  const [state, formAction] = useActionState<VehicleActionState, FormData>(createVehicle, {});
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vehicles</h1>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add vehicle"}
        </Button>
      </div>

      {showForm ? (
        <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Equipment type</label>
            <select name="equipmentType" required className={`mt-1 ${inputClass}`} defaultValue="">
              <option value="" disabled>
                Select equipment
              </option>
              {equipmentTypes.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" required className={`mt-1 ${inputClass}`} defaultValue="active">
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Plate number (optional)</label>
            <input name="plateNumber" className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>VIN (optional)</label>
            <input name="vin" className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>Capacity (lbs, optional)</label>
            <input type="number" name="capacityWeightLbs" min={1} className={`mt-1 ${inputClass}`} />
          </div>
          {state.error ? <p className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
          <div className="sm:col-span-2">
            <SubmitButton />
          </div>
        </form>
      ) : null}
    </div>
  );
}
