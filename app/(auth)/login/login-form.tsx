"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/magnetic";
import { FloatingInput } from "@/components/shared/floating-field";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Magnetic className="block w-full">
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </Magnetic>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      <FloatingInput id="email" name="email" type="email" autoComplete="email" label="Email" required />
      <FloatingInput
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
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
