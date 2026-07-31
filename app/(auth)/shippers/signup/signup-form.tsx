"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/magnetic";
import { FloatingInput } from "@/components/shared/floating-field";
import { signupShipper, type ShipperSignupState } from "./actions";

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

export function ShipperSignupForm() {
  const [state, formAction] = useActionState<ShipperSignupState, FormData>(signupShipper, {});

  return (
    <form action={formAction} className="space-y-4">
      <FloatingInput id="companyName" name="companyName" label="Company name" required />
      <FloatingInput id="industry" name="industry" label="Industry (optional)" />
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
