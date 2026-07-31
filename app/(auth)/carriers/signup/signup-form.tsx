"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupCarrier, type CarrierSignupState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Submitting..." : "Create account"}
    </Button>
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
      <div className="space-y-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" name="companyName" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mcNumber">MC number</Label>
          <Input id="mcNumber" name="mcNumber" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dotNumber">DOT number</Label>
          <Input id="dotNumber" name="dotNumber" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="insuranceExpiryDate">Insurance expiry date</Label>
        <Input id="insuranceExpiryDate" name="insuranceExpiryDate" type="date" required />
      </div>
      <div className="space-y-2">
        <Label>Equipment types</Label>
        <div className="grid grid-cols-2 gap-2">
          {equipmentTypes.map((eq) => (
            <label key={eq.code} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="equipmentTypes" value={eq.code} className="size-4" />
              {eq.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
