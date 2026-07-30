/**
 * Creates one test company + user per role, for local Phase 1 verification
 * of login and role-based routing. Dev-only — never run against production.
 *
 * Deliberately does NOT import lib/supabase/admin.ts or
 * lib/auth/create-profile.ts: both pull in the `server-only` package, which
 * throws when loaded outside Next's server-component bundler (this script
 * runs standalone via tsx). Small, intentional duplication of that logic.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const TEST_PASSWORD = "Test1234!";

const TEST_USERS = [
  { email: "super.admin@test.bluepeakdispatch.local", role: "super_admin", companyKey: "internal", fullName: "Test Super Admin" },
  { email: "brokerage.admin@test.bluepeakdispatch.local", role: "brokerage_admin", companyKey: "internal", fullName: "Test Brokerage Admin" },
  { email: "broker@test.bluepeakdispatch.local", role: "broker", companyKey: "internal", fullName: "Test Broker" },
  { email: "shipper@test.bluepeakdispatch.local", role: "shipper_user", companyKey: "shipper", fullName: "Test Shipper User" },
  { email: "carrier@test.bluepeakdispatch.local", role: "carrier_user", companyKey: "carrier", fullName: "Test Carrier User" },
  { email: "driver@test.bluepeakdispatch.local", role: "driver", companyKey: "carrier", fullName: "Test Driver User" },
] as const;

async function ensureCompanies() {
  const internal = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      type: "internal",
      legalName: "BluePeakDispatch (Internal)",
    },
  });

  const shipper = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      type: "shipper",
      legalName: "Acme Test Shipper Co",
      shipperProfile: { create: {} },
    },
  });

  const carrier = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      type: "carrier",
      legalName: "Test Carrier Co",
      carrierProfile: {
        create: {
          mcNumber: "MC-TEST-0001",
          dotNumber: "DOT-TEST-0001",
          authorityType: "common",
          authorityStatus: "active",
          insuranceExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  return { internal: internal.id, shipper: shipper.id, carrier: carrier.id };
}

async function findAuthUserByEmail(email: string) {
  // Admin API has no direct "get by email" — page through listUsers.
  let page = 1;
  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  const companies = await ensureCompanies();
  const roles = await prisma.role.findMany();
  const roleIdByName = new Map(roles.map((r) => [r.name, r.id]));

  for (const testUser of TEST_USERS) {
    const companyId = companies[testUser.companyKey];
    const roleId = roleIdByName.get(testUser.role);
    if (!roleId) throw new Error(`Role not seeded: ${testUser.role}. Run prisma/seed.ts first.`);

    let authUser = await findAuthUserByEmail(testUser.email);
    if (!authUser) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: testUser.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        app_metadata: { role: testUser.role },
      });
      if (error || !data.user) throw error ?? new Error("createUser returned no user");
      authUser = data.user;
      console.log(`Created auth user ${testUser.email}`);
    } else {
      // Keep app_metadata.role in sync on re-run.
      await adminClient.auth.admin.updateUserById(authUser.id, {
        app_metadata: { role: testUser.role },
      });
      console.log(`Auth user already exists: ${testUser.email}`);
    }

    await prisma.profile.upsert({
      where: { id: authUser.id },
      update: { companyId, roleId, fullName: testUser.fullName, status: "active" },
      create: {
        id: authUser.id,
        companyId,
        roleId,
        fullName: testUser.fullName,
        status: "active",
      },
    });

    if (testUser.role === "driver") {
      await prisma.driver.upsert({
        where: { userId: authUser.id },
        update: {},
        create: { carrierId: companyId, userId: authUser.id, fullName: testUser.fullName },
      });
    }
  }

  console.log(`\nDone. All test users share the password: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
