import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const LABEL_CLASSES =
  "pointer-events-none absolute left-4 top-2.5 text-xs text-brand-gold-600 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground peer-focus:top-2.5 peer-focus:text-xs peer-focus:text-brand-gold-600";

const FIELD_CLASSES =
  "peer w-full rounded-md border border-brand-navy-100 bg-white px-4 pt-6 pb-2.5 text-brand-ink outline-none transition-colors placeholder:text-transparent focus:border-brand-gold-500";

/**
 * CSS-only floating label (`:placeholder-shown`), not JS state — works
 * transparently with uncontrolled server-action forms. See
 * context/design.md §9.
 */
export function FloatingInput({
  id,
  label,
  ...props
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input id={id} placeholder=" " className={FIELD_CLASSES} {...props} />
      <label htmlFor={id} className={LABEL_CLASSES}>
        {label}
      </label>
    </div>
  );
}

export function FloatingTextarea({
  id,
  label,
  rows = 5,
  ...props
}: { id: string; label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="relative">
      <textarea id={id} placeholder=" " rows={rows} className={`${FIELD_CLASSES} resize-none`} {...props} />
      <label htmlFor={id} className={LABEL_CLASSES}>
        {label}
      </label>
    </div>
  );
}
