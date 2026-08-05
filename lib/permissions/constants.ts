/**
 * Single source of truth for permission keys — see
 * context/02-rbac-roles-permissions.md §3-4. `prisma/seed.ts` imports
 * this list to seed `permissions`/`role_permissions`; `lib/permissions/can.ts`
 * imports it for the `PermissionKey` type, so the seeded data and the
 * type-checked call sites can never drift apart.
 */
export const PERMISSIONS = [
  "users:manage",
  "roles:manage",
  "settings:manage",
  "audit_logs:read",
  "companies:manage",
  "companies:read:own",
  // Not in the original context/02-rbac-roles-permissions.md §3 matrix —
  // added for Phase 3: brokers need to browse the Shippers/Carriers
  // directories (context/05-ui-ux-planning.md "Brokerage Operations
  // Dashboard" §Shippers/Carriers) but the matrix only gave them "R
  // own-book, U notes" with no permission key backing "R" at all.
  // brokerage_admin/super_admin already had companies:manage (a superset)
  // so this is additive, not a scope change for them.
  "companies:read:all",
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
  "analytics:read:all",
  "analytics:read:own",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const ROLE_NAMES = [
  "super_admin",
  "brokerage_admin",
  "broker",
  "shipper_user",
  "carrier_user",
  "driver",
] as const;

export type SeedRoleName = (typeof ROLE_NAMES)[number];

/** Derived from the permission matrix in context/02-rbac-roles-permissions.md §3. */
export const ROLE_PERMISSIONS: Record<SeedRoleName, PermissionKey[]> = {
  super_admin: [...PERMISSIONS],
  brokerage_admin: [
    "audit_logs:read",
    "companies:manage",
    "companies:read:all",
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
    "analytics:read:all",
  ],
  broker: [
    "companies:read:all",
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
    "analytics:read:all",
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
    "analytics:read:own",
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
    "analytics:read:own",
  ],
  driver: [
    "loads:read:own",
    "loads:update:status",
    "documents:upload",
    "tracking_events:create",
    "notifications:read:own",
  ],
};
