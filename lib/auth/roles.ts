export const ROLE_NAMES = [
  "super_admin",
  "brokerage_admin",
  "broker",
  "shipper_user",
  "carrier_user",
  "driver",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export type PortalSegment = "shipper" | "carrier" | "ops" | "admin";

/** Which top-level portal path segments a role may access. */
const ROLE_PORTALS: Record<RoleName, PortalSegment[]> = {
  super_admin: ["ops", "admin"],
  brokerage_admin: ["ops", "admin"],
  broker: ["ops"],
  shipper_user: ["shipper"],
  // Driver portal is deferred past MVP (see context/07-open-questions.md);
  // driver accounts fall back to the carrier portal for now.
  carrier_user: ["carrier"],
  driver: ["carrier"],
};

/** Where to send a role immediately after login / when landing on "/". */
const ROLE_HOME: Record<RoleName, string> = {
  super_admin: "/ops/dashboard",
  brokerage_admin: "/ops/dashboard",
  broker: "/ops/dashboard",
  shipper_user: "/shipper/dashboard",
  carrier_user: "/carrier/dashboard",
  driver: "/carrier/dashboard",
};

export function portalsForRole(role: RoleName): PortalSegment[] {
  return ROLE_PORTALS[role];
}

export function homePathForRole(role: RoleName): string {
  return ROLE_HOME[role];
}

export function canAccessPortal(role: RoleName, portal: PortalSegment): boolean {
  return ROLE_PORTALS[role].includes(portal);
}
