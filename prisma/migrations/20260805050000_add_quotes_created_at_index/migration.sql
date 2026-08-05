-- Found via Phase 9 load testing (2000+ load / 670+ quote volume):
-- app/ops/quotes/page.tsx orders by created_at desc with no filter — quotes
-- had no index backing that sort, forcing a full-table Seq Scan + in-memory
-- sort. Cheap at today's volume, but grows unbounded with quote history —
-- add it now while it's a one-line fix rather than after it's noticeable.
CREATE INDEX "quotes_created_at_idx" ON "quotes" ("created_at");
