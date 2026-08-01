import { Quote } from "lucide-react";

/**
 * Quote + role attribution — no headshot photography (context/design.md §6
 * bans people-in-office stock imagery), so identity is a monogram derived
 * from the organization type rather than a fabricated person's initials.
 * `large` renders the lead/asymmetric card in a testimonial grid.
 */
export function TestimonialCard({
  quote,
  role,
  monogram,
  large = false,
}: {
  quote: string;
  role: string;
  monogram: string;
  large?: boolean;
}) {
  return (
    <div className={`border border-brand-navy-100 p-7 ${large ? "rounded-lg sm:p-10" : "rounded-lg"}`}>
      <Quote className="size-6 text-brand-gold-500" strokeWidth={1.5} />
      <p className={`mt-4 text-brand-ink ${large ? "text-xl leading-snug sm:text-2xl" : "text-base leading-relaxed"}`}>
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy-100 font-heading text-xs font-semibold text-brand-navy-700">
          {monogram}
        </span>
        <span className="text-sm text-muted-foreground">{role}</span>
      </div>
    </div>
  );
}
