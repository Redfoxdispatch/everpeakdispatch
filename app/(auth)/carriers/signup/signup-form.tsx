"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/magnetic";
import { FloatingInput } from "@/components/shared/floating-field";
import { signupCarrier, type CarrierSignupState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Magnetic className="block w-full">
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Submitting..." : "Create account"}
      </Button>
    </Magnetic>
  );
}

export function CarrierSignupForm({
  equipmentTypes,
}: {
  equipmentTypes: { code: string; label: string }[];
}) {
  const [state, formAction] = useActionState<CarrierSignupState, FormData>(signupCarrier, {});

  return (
    <form action={formAction} className="space-y-4">
      <FloatingInput id="companyName" name="companyName" label="Company name" required />
      <div className="grid grid-cols-2 gap-4">
        <FloatingInput id="mcNumber" name="mcNumber" label="MC number" required />
        <FloatingInput id="dotNumber" name="dotNumber" label="DOT number" required />
      </div>
      <FloatingInput
        id="insuranceExpiryDate"
        name="insuranceExpiryDate"
        type="date"
        label="Insurance expiry date"
        required
      />
      <div>
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Equipment types
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {equipmentTypes.map((eq) => (
            <label key={eq.code} className="group">
              <input
                type="checkbox"
                name="equipmentTypes"
                value={eq.code}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-brand-navy-100 px-3.5 py-1.5 text-sm text-brand-ink transition-colors peer-checked:border-brand-gold-500 peer-checked:bg-brand-gold-500 peer-checked:text-brand-navy-950 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold-500/50">
                {eq.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      <FloatingInput id="fullName" name="fullName" label="Your name" required />
      <FloatingInput id="email" name="email" type="email" autoComplete="email" label="Email" required />
      <FloatingInput id="phone" name="phone" type="tel" autoComplete="tel" label="Phone (optional)" />
      <FloatingInput
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        label="Password"
        required
      />
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
