"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { StopsEditor, useStopsDraft } from "@/components/shared/stops-editor";
import { createShipment, type CreateShipmentState } from "../actions";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-medium text-muted-foreground";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit shipment request"}
    </Button>
  );
}

export function ShipmentForm({ equipmentTypes }: { equipmentTypes: { code: string; label: string }[] }) {
  const [state, formAction] = useActionState<CreateShipmentState, FormData>(createShipment, {});
  const { stops, updateStop, addStop, removeStop } = useStopsDraft();

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="stopsJson" value={JSON.stringify(stops)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Mode</label>
          <select name="mode" required className={`mt-1 ${inputClass}`} defaultValue="ftl">
            <option value="ftl">Full Truckload (FTL)</option>
            <option value="ltl">Less Than Truckload (LTL)</option>
          </select>
        </div>
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
          <label className={labelClass}>Weight (lbs)</label>
          <input type="number" name="weightLbs" min={1} required className={`mt-1 ${inputClass}`} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Commodity</label>
          <input name="commodity" required className={`mt-1 ${inputClass}`} placeholder="e.g. Palletized dry goods" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Special instructions (optional)</label>
          <textarea name="specialInstructions" rows={3} className={`mt-1 ${inputClass} resize-none`} />
        </div>
      </div>

      <StopsEditor stops={stops} onUpdate={updateStop} onAdd={addStop} onRemove={removeStop} />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}
