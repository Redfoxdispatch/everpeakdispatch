-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "window_start" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- RLS: this table is written exclusively via the Prisma service-role
-- connection (lib/rate-limit/check.ts) and never read by any client — enable
-- RLS with no policies, matching every other table's fail-closed default,
-- for consistency with the Phase 9 audit rather than any specific threat.
ALTER TABLE "rate_limit_buckets" ENABLE ROW LEVEL SECURITY;
