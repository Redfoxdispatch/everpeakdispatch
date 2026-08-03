"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createDriver, type DriverActionState } from "./actions";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const labelClass = "text-xs font-medium text-muted-foreground";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding..." : "Add driver"}
    </Button>
  );
}

export function DriverForm() {
  const [state, formAction] = useActionState<DriverActionState, FormData>(createDriver, {});
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Drivers</h1>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add driver"}
        </Button>
      </div>

      {showForm ? (
        <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full name</label>
            <input name="fullName" required className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input name="phone" className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>License number (optional)</label>
            <input name="licenseNumber" className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>License expiry (optional)</label>
            <input type="date" name="licenseExpiry" className={`mt-1 ${inputClass}`} />
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
