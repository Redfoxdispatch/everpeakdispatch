import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  "super_admin",
  "brokerage_admin",
  "broker",
  "shipper_user",
  "carrier_user",
  "driver",
] as const;

type RoleName = (typeof ROLES)[number];

// resource:action[:scope] — see context/02-rbac-roles-permissions.md §4
const PERMISSIONS = [
  "users:manage",
  "roles:manage",
  "settings:manage",
  "audit_logs:read",
  "companies:manage",
  "companies:read:own",
  "loads:create",
  "loads:read:own",
  "loads:read:all",
  "loads:update:status",
  "loads:cancel",
  "quotes:create",
  "quotes:accept",
  "quotes:counter",
  "quotes:reject",
  "carrier_assignments:create",
  "carrier_assignments:accept",
  "carrier_assignments:decline",
  "documents:upload",
  "documents:approve",
  "invoices:issue",
  "invoices:read:own",
  "payments:record",
  "rates:view:sell",
  "rates:view:buy",
  "rates:view:margin",
  "tracking_events:create",
  "messages:send",
  "notifications:read:own",
] as const;

type PermissionKey = (typeof PERMISSIONS)[number];

// Derived from the permission matrix in context/02-rbac-roles-permissions.md §3
const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  super_admin: [...PERMISSIONS],
  brokerage_admin: [
    "audit_logs:read",
    "companies:manage",
    "loads:create",
    "loads:read:all",
    "loads:update:status",
    "loads:cancel",
    "quotes:create",
    "carrier_assignments:create",
    "documents:upload",
    "documents:approve",
    "invoices:issue",
    "payments:record",
    "rates:view:sell",
    "rates:view:buy",
    "rates:view:margin",
    "tracking_events:create",
    "messages:send",
    "notifications:read:own",
  ],
  broker: [
    "loads:create",
    "loads:read:all",
    "loads:update:status",
    "loads:cancel",
    "quotes:create",
    "carrier_assignments:create",
    "documents:upload",
    "documents:approve",
    "invoices:issue",
    "payments:record",
    "rates:view:sell",
    "rates:view:buy",
    "rates:view:margin",
    "tracking_events:create",
    "messages:send",
    "notifications:read:own",
  ],
  shipper_user: [
    "companies:read:own",
    "loads:create",
    "loads:read:own",
    "quotes:accept",
    "quotes:counter",
    "quotes:reject",
    "documents:upload",
    "invoices:read:own",
    "payments:record",
    "messages:send",
    "notifications:read:own",
  ],
  carrier_user: [
    "companies:read:own",
    "loads:read:own",
    "loads:update:status",
    "carrier_assignments:accept",
    "carrier_assignments:decline",
    "documents:upload",
    "invoices:read:own",
    "rates:view:buy",
    "tracking_events:create",
    "messages:send",
    "notifications:read:own",
  ],
  driver: [
    "loads:read:own",
    "loads:update:status",
    "documents:upload",
    "tracking_events:create",
    "notifications:read:own",
  ],
};

// code, label — see context/03-database-schema.md §3 equipment_types
const EQUIPMENT_TYPES = [
  { code: "dry_van", label: "Dry Van" },
  { code: "reefer", label: "Refrigerated" },
  { code: "flatbed", label: "Flatbed" },
  { code: "step_deck", label: "Step Deck" },
  { code: "power_only", label: "Power Only" },
  { code: "box_truck", label: "Box Truck" },
  { code: "conestoga", label: "Conestoga" },
];

async function main() {
  console.log("Seeding roles...");
  const roleRecords = new Map<RoleName, string>();
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystemRole: true },
    });
    roleRecords.set(name, role.id);
  }

  console.log("Seeding permissions...");
  const permissionRecords = new Map<PermissionKey, string>();
  for (const key of PERMISSIONS) {
    const [resource, action, scope] = key.split(":") as [string, string, string?];
    // Prisma's compound-unique `where` input rejects `null` for a nullable
    // field (Postgres treats NULL as always-distinct in UNIQUE constraints
    // anyway, so the compound unique can't reliably identify a null-scope
    // row) — look up with a plain filter instead of upsert().
    const existing = await prisma.permission.findFirst({
      where: { resource, action, scope: scope ?? null },
    });
    const permission =
      existing ?? (await prisma.permission.create({ data: { resource, action, scope: scope ?? null } }));
    permissionRecords.set(key, permission.id);
  }

  console.log("Wiring role_permissions...");
  for (const role of ROLES) {
    const roleId = roleRecords.get(role)!;
    for (const key of ROLE_PERMISSIONS[role]) {
      const permissionId = permissionRecords.get(key)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  console.log("Seeding equipment types...");
  for (const { code, label } of EQUIPMENT_TYPES) {
    await prisma.equipmentType.upsert({
      where: { code },
      update: { label },
      create: { code, label },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
