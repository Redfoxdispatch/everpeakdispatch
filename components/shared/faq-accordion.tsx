"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Single-open FAQ accordion — hairline dividers, no shadows, matching the
 * card/border language in context/design.md §9. Built on motion rather than
 * native `<details>` so the expand/collapse gets the same eased-height
 * animation as the rest of the site's interactive elements.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useSafeReducedMotion();

  return (
    <div className="divide-y divide-brand-navy-100 border-y border-brand-navy-100">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="font-medium text-brand-ink">{item.question}</span>
              <motion.span
                className="flex size-6 shrink-0 items-center justify-center text-brand-gold-600"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
              >
                <Plus className="size-5" strokeWidth={1.75} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 pr-12 text-muted-foreground">{item.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
