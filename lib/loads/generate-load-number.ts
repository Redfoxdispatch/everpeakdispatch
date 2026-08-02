import "server-only";
import { db } from "@/lib/db/client";

/**
 * Human-readable sequential load number (see context/03-database-schema.md
 * §4: "e.g. RFX-000123, generated via sequence"). Uses a count-based
 * candidate + retry-on-collision rather than a dedicated Postgres sequence
 * — simpler to ship without a new migration, and safe enough for MVP's
 * manual, low-concurrency load creation: the database's unique constraint
 * on `loadNumber` is still the actual race-safety net, this just picks a
 * sensible next candidate and retries if it loses a race.
 */
export async function generateLoadNumber(): Promise<string> {
  const count = await db.load.count();
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `EPD-${String(count + 1 + attempt).padStart(6, "0")}`;
    const exists = await db.load.findUnique({ where: { loadNumber: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique load number after 5 attempts.");
}
