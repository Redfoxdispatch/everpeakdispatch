"use client";

import { motion, type Variants } from "motion/react";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/**
 * Scroll-triggered fade + rise for a single element. See context/design.md
 * §7. `variant="image"` is a stronger entrance for image cards — scales up
 * from 92% and rises from further below — used where a photo, not body
 * copy, is the thing scrolling into view.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: "default" | "image";
}) {
  const reduceMotion = useSafeReducedMotion();
  const isImage = variant === "image";

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion ? { opacity: 0 } : isImage ? { opacity: 0, y: 72, scale: 0.92 } : { opacity: 0, y: 16 }
      }
      whileInView={reduceMotion ? { opacity: 1 } : isImage ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: isImage ? 0.8 : 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Load-time (not scroll-triggered) fade + rise, for above-the-fold hero content. */
export function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useSafeReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

/** Wrap a group of RevealItem children to stagger their entrance ~80ms apart. */
export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={groupVariants}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useSafeReducedMotion();

  return (
    <motion.div className={className} variants={reduceMotion ? itemVariantsReduced : itemVariants}>
      {children}
    </motion.div>
  );
}
