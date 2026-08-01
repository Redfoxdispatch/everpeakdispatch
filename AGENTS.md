# EverPeakDispatch — Freight Brokerage Platform

Full product/architecture docs live in `context/` (not shipped, git-ignored — read them locally): business workflow, RBAC, database schema, application architecture, UI/UX plan, and roadmap. Read the relevant doc before touching a new area of the codebase.

## Stack pins — do not casually upgrade

- **Next.js is pinned to `15.5.22`**, not latest. `create-next-app` currently scaffolds Next 16, which ships its own `AGENTS.md` warning that it has breaking changes from most training data. This project intentionally stayed on 15 (App Router, same conventions as Next.js 15 docs) for that reason. If you're about to run `next` upgrade tooling, stop and check with the user first.
- **Prisma is on v7**, which changed significantly from v5/6: driver adapters are required (`@prisma/adapter-pg` + `pg`, not the old Rust engine binary), connection config lives in `prisma.config.ts` (not `datasource.url` in `schema.prisma`), and the generated client is emitted to `lib/generated/prisma` (git-ignored, regenerate with `npx prisma generate`) rather than `node_modules`. Prisma also installed its own agent skill docs under `.agents/skills/prisma-*` — read those before writing schema/migration/client code; they're git-ignored so re-fetch them with `npx prisma init` if missing.
- Database is Supabase Postgres. Prisma's server-side queries connect directly and **bypass Row Level Security** — RLS is enabled on every table (see the migration) as a safety net for Supabase's auto-generated REST API and for Realtime, not as the primary authorization layer. Every server action must independently check permissions before querying (see `context/04-application-architecture.md` §3).

## Conventions

- TypeScript strict, no `any` unless truly unavoidable.
- Server actions are the default for mutations; route handlers only for webhooks, cron targets, and signed-URL issuance.
- Every feature ships with: schema change, types, Zod validation, authorization check, UI (loading/error/empty states), and an audit log entry for state-changing actions.
