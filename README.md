# BluePeakDispatch

Freight brokerage management platform — public marketing site, shipper portal, carrier portal, internal operations dashboard, and admin panel. Built with Next.js 15 (App Router), TypeScript, Tailwind, Prisma 7 + Supabase Postgres, and Supabase Auth/Storage/Realtime.

Working name only; see `AGENTS.md` for stack-pinning notes.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + database values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` (and also to `.env`, since the Prisma CLI reads `.env` rather than `.env.local`) and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Project Settings → Data API
- `SUPABASE_SERVICE_ROLE_KEY` — same page, server-only, never expose to the browser
- `DATABASE_URL` / `DIRECT_URL` — Supabase Project Settings → Database → Connection string. Percent-encode any special characters in the DB password (e.g. `@` → `%40`).

### Database

```bash
npx prisma generate                        # regenerate the client into lib/generated/prisma (git-ignored)
npx prisma migrate dev --create-only --name <change>   # write a new migration's SQL, don't apply it
npx prisma migrate deploy                  # apply pending migrations
npx prisma studio                          # inspect data
```

**Always use `--create-only` + `migrate deploy`, never plain `migrate dev`.** The very first migration adds a foreign key from `profiles` to Supabase-managed `auth.users` (see `prisma/migrations/*/migration.sql`) and enables RLS. `migrate dev`'s shadow-database step replays the *entire* migration history against a bare Postgres database that doesn't have Supabase's `auth` schema, so it will always fail with `schema "auth" does not exist" — this isn't a one-off issue, it's permanent for this project. After hand-editing a `--create-only` migration (e.g. adding another raw-SQL constraint), review the generated SQL before running `migrate deploy`.

### Flaky local DNS

If Prisma commands fail with `Can't reach database server` / `P1001`, it's very likely a local DNS issue, not a real outage: this network's router can't reliably resolve the Supabase pooler hostname (a multi-level CNAME to an AWS load balancer), while general internet access works fine. Prisma's `migrate`/`db` commands shell out to a native binary that does its own OS-level DNS resolution, so it isn't fixable by overriding Node's resolver — it's simply intermittent, and retrying 2-5 times reliably gets through. `npm run` scripts and the Next.js dev server (pure JS via `pg`) additionally benefit from `scripts/dns-fix.cjs`, which is preloaded automatically where relevant.

## Docs

Full product/architecture documentation (business workflow, RBAC, schema rationale, phased roadmap) lives in `context/` locally — it's git-ignored and not part of the shipped codebase.
