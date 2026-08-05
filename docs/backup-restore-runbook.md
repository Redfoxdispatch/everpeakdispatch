# Backup & Restore Runbook — Supabase Postgres

Written for Phase 9 (production hardening) — see `context/06-development-roadmap.md`. This is the single source of truth for "how do we get our data back if something goes wrong." Read it before you need it, not during an incident.

## 1. Current state: Free tier has zero built-in backup protection

As of writing, Supabase's plans break down like this:

| Plan | Daily automatic backups | Point-in-Time Recovery (PITR) |
|---|---|---|
| **Free** (current plan) | **None** | Not available |
| Pro ($25/mo base) | 7 days, included | Optional add-on, from ~$100/mo (7-day retention) |
| Team | 14 days, included | Optional add-on |
| Enterprise | Up to 30 days, included | Optional add-on |

Source: [Supabase Database Backups docs](https://supabase.com/docs/guides/platform/backups).

**What this means concretely:** on the Free plan, Supabase keeps no snapshot of this database at all. If a bad migration, an accidental bulk delete, a compromised credential, or a bug corrupts or destroys data, there is no vendor-side undo — recovery depends entirely on whatever backup routine we run ourselves. This is a real, material risk for a system about to move real money for real shippers/carriers, and it doesn't require a fix in code — it requires a decision.

### Recommendation

- **Before real transactions start flowing**, upgrade to at least **Pro** ($25/mo). That alone changes "zero backups" into "7 days of daily backups, included" — the single highest-leverage change available here, and it's the base plan price, not the PITR add-on.
- **PITR (the $100+/mo add-on)** gives second-level recovery granularity instead of "as of last night's snapshot." It's a reasonable upgrade once real transaction volume makes a full day of potential data loss unacceptable, but daily backups on Pro are very likely sufficient to launch on — treat PITR as a "revisit this once volume justifies it" line item, not a launch blocker.
- **Until the plan is upgraded**, the manual routine below is the only thing standing between this database and permanent data loss. Set it up now.

## 2. Manual backup routine (required while on Free tier)

Supabase's own recommendation for Free-tier projects is to run `supabase db dump` (or plain `pg_dump`, same underlying tool) on a schedule and store the output somewhere outside Supabase.

### Command

```bash
pg_dump "$DATABASE_URL" -F c -f "backup-$(date +%Y%m%d).dump"
```

- `-F c` (custom format) supports compression and selective/parallel restore — prefer it over a plain `.sql` dump.
- Use the **same `DATABASE_URL`** the app already connects with (Transaction pooler connection string — see `.env.example`).
- This backs up the `public` schema (all the tables in `prisma/schema.prisma`) but **not** the Supabase-managed `auth` schema by default — see §4 for why that matters.

### Where to run it

Vercel's serverless functions **cannot** run `pg_dump` (it's a native binary, not available in that runtime) — this has to run somewhere with a real filesystem and Postgres client tools installed. Options, cheapest first:

1. **A scheduled GitHub Actions workflow** (recommended) — GitHub-hosted runners already have `pg_dump` available, and a scheduled workflow costs nothing on a public repo / is cheap on a private one. Have the job dump the DB, then upload the artifact to a private, non-git location (Supabase Storage in a private bucket, S3, or GitHub Actions artifact storage with a short retention window as a last resort).
2. **A local cron job / Task Scheduler entry** on a machine that's reliably on — fine for now, but a single point of failure if that machine is off or the person running it is unavailable.

### Retention

Keep at minimum: **14 daily backups + 6 monthly backups**. Delete older dailies once the corresponding monthly exists. Store backups encrypted at rest if the storage location doesn't already guarantee it.

### Never do this

- Never commit a backup file to the git repo (`.gitignore` doesn't protect against this if someone forces it in — this is a discipline issue, not a tooling one). A backup contains real customer PII and financial data.

## 3. Restore procedure

**Practice this on a disposable/staging Supabase project before you ever need it for real.** The first time you run a restore should not be during an actual incident.

### If PITR is available (Pro+ with the add-on enabled)

1. Supabase Dashboard → Database → Backups → pick a timestamp → Restore.
2. This is the fastest, lowest-risk path — Supabase handles schema + data + `auth` schema together.
3. After restoring, verify RLS policies survived (see §4) — a restore to a point before the Phase 9 RLS migration ran would silently put every table back to fail-closed-except-notifications.

### If restoring from a manual `pg_dump` (Free tier, or a Pro-tier restore predating any backup)

1. Provision a fresh Supabase project (or point at a scratch/staging one for a drill — **never** restore directly onto a live database you don't intend to fully overwrite).
2. `pg_restore -d "$TARGET_DATABASE_URL" -c "backup-YYYYMMDD.dump"` — the `-c` flag drops existing objects first, so this is destructive to whatever you point it at.
3. Re-run any Prisma migrations dated after the backup: `npx prisma migrate deploy`, or for Supabase-specific SQL that the shadow database can't validate (RLS policies, `ALTER PUBLICATION`, etc. — see this repo's README for why), the manual `prisma db execute --file ... && prisma migrate resolve --applied ...` pattern already used throughout `prisma/migrations/`.
4. Re-verify: row counts are in the right ballpark, `SELECT * FROM pg_policies;` shows the full RLS policy set (not just the original `notifications` one), and a real login round-trip works end-to-end.

## 4. What a plain `pg_dump` of the `public` schema does NOT cover

- **`auth.users`** (Supabase-managed) — a `pg_dump` targeting only the `public` schema (the default, and what `prisma/schema.prisma` models) does not include Supabase Auth's own tables. Losing this without a matching backup means every user's login credentials are gone even if `profiles` rows survive — the two would no longer line up. If you need a full disaster-recovery-grade dump, explicitly include the `auth` schema (`pg_dump --schema=public --schema=auth ...`), understanding that Supabase manages that schema's structure and a bad restore into it can break Auth entirely — treat this as an advanced/last-resort option, not the default routine.
- **Supabase Storage objects** (uploaded PODs, BOLs, insurance certs, W-9s — see `lib/storage/documents.ts`) — these live in Storage buckets, not Postgres, and a database dump/restore does nothing for them. They need a separate backup strategy (e.g. a periodic sync of the bucket contents) if document loss would be unacceptable. Not yet built — flagged here as a known gap, not solved by this runbook.

## 5. Action items

1. Upgrade to Supabase Pro before onboarding real, paying shippers/carriers — closes the "zero backups" gap immediately.
2. Until then, stand up the scheduled `pg_dump` workflow in §2 — this is the only thing currently protecting this data.
3. Run one practice restore drill against a disposable project, and note how long it actually takes — that number matters for setting expectations during a real incident.
4. Revisit PITR once real transaction volume makes "worst case, we lose today's transactions" an unacceptable answer.
