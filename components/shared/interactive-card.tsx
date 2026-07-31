"use client";

import { motion } from "motion/react";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

/**
 * Hover-lift card with a gold accent bar that grows in — see
 * context/design.md §9. `icon` takes a pre-rendered element (rendered by
 * the calling Server Component), not a component reference — RSC can't
 * serialize function/component references across the server→client
 * boundary, only plain data and already-rendered elements.
 */
export function InteractiveCard({
  icon,
  index,
  title,
  description,
}: {
  icon: React.ReactNode;
  index: number;
  title: string;
  description: string;
}) {
  const reduceMotion = useSafeReducedMotion();

  return (
    <motion.div
      className="group relative overflow-hidden rounded-lg border border-brand-navy-100 bg-white p-7"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-gold-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      <div className="flex items-center justify-between">
        {icon}
        <span className="font-heading text-xs text-brand-navy-500">0{index + 1}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-brand-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
