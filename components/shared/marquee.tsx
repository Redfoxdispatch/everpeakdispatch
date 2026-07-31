"use client";

import { useSafeReducedMotion } from "./use-safe-reduced-motion";

/**
 * Slanted, infinite-scrolling text banner for the footer — see
 * context/design.md §9. Pure CSS animation (a track rendered twice,
 * translated by exactly -50%, `@keyframes marquee` in globals.css) — no
 * scroll listener involved, it just runs continuously. The full `animation`
 * shorthand is set inline (not via a class) so its duration can't be
 * silently dropped by a competing declaration.
 */
export function Marquee({
  text,
  angle,
  durationSeconds = 26,
  className,
}: {
  text: string;
  angle: number;
  durationSeconds?: number;
  className?: string;
}) {
  const reduceMotion = useSafeReducedMotion();

  return (
    // Outer wrapper clips at the parent's actual width (never wider than
    // 100%) — the rotated bar lives entirely inside it, so overflow from
    // the rotation never escapes into the page's own layout width. The
    // vertical padding is a buffer: at a ~2-3deg rotation over a ~120vw-wide
    // bar, the bar's edges swing ~35-45px above/below its resting position
    // — without this buffer the clip box cuts those corners off.
    <div className="w-full overflow-hidden py-8 sm:py-12">
      <div className="-ml-[10%] w-[120%]" style={{ transform: `rotate(${angle}deg)` }}>
        <div
          className={`flex w-max items-center whitespace-nowrap ${className ?? ""}`}
          style={{ animation: reduceMotion ? "none" : `marquee ${durationSeconds}s linear infinite` }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="mx-4 font-heading text-[clamp(2.5rem,7vw,5.5rem)] leading-none font-bold tracking-tight uppercase sm:mx-6"
                >
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
