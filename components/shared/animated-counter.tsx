"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/** Counts up from 0 to `value` once scrolled into view. See context/design.md §7. */
export function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const reduceMotion = useSafeReducedMotion();

  useEffect(() => {
    if (!isInView || !ref.current) return;

    if (reduceMotion) {
      ref.current.textContent = value.toLocaleString() + suffix;
      return;
    }

    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate(latest) {
        if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString() + suffix;
      },
    });
    return () => controls.stop();
  }, [isInView, value, suffix, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
