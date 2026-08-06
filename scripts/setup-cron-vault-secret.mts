/**
 * One-time (idempotent) setup: stores CRON_SECRET in Supabase Vault under
 * the name 'cron_secret' so the pg_cron jobs in
 * prisma/migrations/20260805070000_schedule_cron_jobs can attach it as a
 * Bearer token via vault.decrypted_secrets, without the raw value ever
 * appearing in a git-tracked file. Reads CRON_SECRET from the local
 * environment (.env/.env.local) — never hardcode the value here.
 *
 * Run this once per environment (local/staging/prod database) whenever
 * CRON_SECRET changes: `npx tsx scripts/setup-cron-vault-secret.mts`
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not set in the environment.");

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM vault.secrets WHERE name = 'cron_secret'`,
  );

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      `SELECT vault.update_secret($1::uuid, $2::text)`,
      existing[0].id,
      secret,
    );
    console.log("Updated existing 'cron_secret' in Supabase Vault.");
  } else {
    await prisma.$executeRawUnsafe(
      `SELECT vault.create_secret($1::text, 'cron_secret', 'Bearer token for app/api/cron/* route handlers, called by pg_cron via pg_net')`,
      secret,
    );
    console.log("Created 'cron_secret' in Supabase Vault.");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
