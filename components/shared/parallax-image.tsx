"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

/**
 * Scroll-scrubbed parallax — the image moves at a different rate than the
 * page scroll, tied directly to scroll progress (not a viewport-triggered
 * one-shot fade). See context/design.md §7. `strength` is the max pixel
 * offset in each direction.
 */
export function ParallaxImage({
  src,
  alt,
  className,
  strength = 60,
  priority,
  fill = false,
}: {
  src: string;
  alt: string;
  className?: string;
  strength?: number;
  priority?: boolean;
  /**
   * Full-bleed background use (hero sections, split-panel images) — makes
   * the root absolutely positioned so it fills its nearest positioned
   * ancestor via `inset-0`, instead of occupying its own space in normal
   * flow. Without this, a caller passing "absolute inset-0" in `className`
   * loses that fight to this component's own hardcoded "relative" (Tailwind
   * resolves conflicting position utilities by stylesheet order, not
   * className order) — the image then sits in normal flow at full height,
   * pushing any sibling content below the visible viewport entirely.
   */
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useSafeReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-strength, strength]);

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${fill ? "absolute inset-0" : "relative"} ${className ?? ""}`}
    >
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[12%] -bottom-[12%]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover [filter:contrast(1.05)_saturate(0.9)]"
        />
      </motion.div>
    </div>
  );
}
