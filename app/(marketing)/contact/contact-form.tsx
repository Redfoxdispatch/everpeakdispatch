"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/magnetic";
import { FloatingInput, FloatingTextarea } from "@/components/shared/floating-field";
import { submitContact, type ContactState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Magnetic className="block w-full">
      <Button type="submit" className="w-full" disabled={pending} size="lg">
        {pending ? "Sending..." : "Send message"}
      </Button>
    </Magnetic>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<ContactState, FormData>(submitContact, {});

  if (state.success) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-md border border-brand-navy-100 bg-brand-navy-100/40 p-5 text-brand-ink"
      >
        Thanks for reaching out — someone from our team will get back to you shortly.
      </motion.p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FloatingInput id="fullName" name="fullName" label="Name" required />
      <FloatingInput id="email" name="email" type="email" autoComplete="email" label="Email" required />
      <div className="grid grid-cols-2 gap-4">
        <FloatingInput id="phone" name="phone" type="tel" autoComplete="tel" label="Phone (optional)" />
        <FloatingInput id="company" name="company" label="Company (optional)" />
      </div>
      <FloatingTextarea id="message" name="message" label="Message" required />
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
