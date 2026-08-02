import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PERMISSIONS,
  ROLE_NAMES as ROLES,
  ROLE_PERMISSIONS,
  type PermissionKey,
  type SeedRoleName as RoleName,
} from "../lib/permissions/constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
