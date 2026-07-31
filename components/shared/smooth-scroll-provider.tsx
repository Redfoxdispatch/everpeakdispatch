"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Buttery scroll physics for the marketing/auth surface only — deliberately
 * NOT wrapped around the operational portals, where native scroll behavior
 * is what power users expect on data-dense tables (see context/design.md).
 * Respects prefers-reduced-motion by not initializing at all.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
