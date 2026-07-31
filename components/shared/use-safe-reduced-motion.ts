"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe prefers-reduced-motion detection.
 *
 * `motion`'s own `useReducedMotion()` can resolve differently between the
 * server render and the client's first (hydration) render, which produces
 * a real hydration mismatch — Next.js then throws away and re-renders the
 * whole subtree. Symptom: components that branch their JSX on the reduced-
 * motion value (e.g. SplitText falling back to plain text) render
 * different markup server vs. client; components whose mount effect exits
 * early when reduced-motion is (incorrectly) true on first client render
 * never activate.
 *
 * This hook always starts at `false` on both server and the client's first
 * render — guaranteeing they match — then reads the real
 * `(prefers-reduced-motion: reduce)` media query after mount and updates.
 * That correction is an ordinary post-hydration state update, not a
 * mismatch. Use this everywhere instead of `motion`'s `useReducedMotion`.
 */
export function useSafeReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}
