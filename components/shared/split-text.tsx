"use client";

import { motion } from "motion/react";
import type { ElementType } from "react";
import { useSafeReducedMotion } from "./use-safe-reduced-motion";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/**
 * Splits text into words, each masked and rising into place — see
 * context/design.md §7. Words, not characters: character-splitting reads
 * as a gimmick on body-length copy; word-splitting reads as craft.
 *
 * `trigger="scroll"` (default) uses whileInView, correct for copy the user
 * scrolls to. `trigger="load"` animates on mount instead — required for
 * text inside a fixed, non-scrolling viewport (e.g. the auth split-screen
 * panel): whileInView's shrunk "-10%" margin can fail to detect elements
 * pinned near the viewport edge when there's no scroll motion to
 * re-trigger the IntersectionObserver.
 */
export function SplitText({
  children,
  className,
  delay = 0,
  as: Tag = "span",
  trigger = "scroll",
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: ElementType;
  trigger?: "scroll" | "load";
}) {
  const reduceMotion = useSafeReducedMotion();
  const words = children.split(" ");

  if (reduceMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  const revealProps =
    trigger === "load"
      ? { animate: { y: "0%" } }
      : {
          whileInView: { y: "0%" },
          viewport: { once: true, margin: "-10% 0px -10% 0px" } as const,
        };

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-top pb-[0.15em]"
          style={{ marginRight: i < words.length - 1 ? "0.28em" : 0 }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            {...revealProps}
            transition={{ duration: 0.7, delay: delay + i * 0.035, ease: EASE }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
