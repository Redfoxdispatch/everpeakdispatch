import type { Load, LoadStop, Company, Quote, CarrierAssignment } from "@/lib/generated/prisma/client";

/**
 * Audience-scoped views of a `Load` — see context/04-application-architecture.md
 * §3 ("DTO/serializer split by audience") and context/02-rbac-roles-permissions.md
 * §1 rule 2: a carrier must never receive `sell_rate`/margin, a shipper must
 * never receive `buy_rate`. Rates live on `Quote`/`CarrierAssignment`, not on
 * `Load` itself, so callers pass those in via `relations` once quote/
 * assignment records exist; omit them (they're optional) for a load that
 * hasn't been quoted/assigned yet and every view just gets `null` rates.
 *
 * Carriers additionally don't get the shipper's identity or exact stop
 * address until their assignment is `accepted` — standard freight-brokerage
 * practice to prevent a carrier circumventing the broker on a future load
 * (see context/01-business-workflow.md §1: "neither party may see the
 * other's rate" is the headline rule, but shipper identity protection until
 * commitment is the same category of concern).
 */

type Address = { line1?: string; line2?: string; city?: string; state?: string; zip?: string };

function parseAddress(value: unknown): Address {
  if (value && typeof value === "object") return value as Address;
  return {};
}

export type LoadForSerialization = Load & {
  shipperCompany: Pick<Company, "id" | "legalName" | "dbaName">;
  stops: LoadStop[];
  relations?: {
    /** The load's currently-accepted quote, if booked. */
    acceptedQuote?: Pick<Quote, "sellRate" | "currency"> | null;
    /** This load's accepted carrier assignment, if one exists. */
    acceptedAssignment?: Pick<CarrierAssignment, "carrierRate" | "status" | "carrierCompanyId"> | null;
  };
};

type StopView = {
  stopType: LoadStop["stopType"];
  sequence: number;
  city: string | undefined;
  state: string | undefined;
  fullAddress: { line1: string | undefined; line2: string | undefined; zip: string | undefined } | null;
  appointmentEarliest: Date;
  appointmentLatest: Date;
  status: LoadStop["status"];
};

function stopView(stop: LoadStop, revealFullAddress: boolean): StopView {
  const address = parseAddress(stop.address);
  return {
    stopType: stop.stopType,
    sequence: stop.sequence,
    city: address.city,
    state: address.state,
    fullAddress: revealFullAddress ? { line1: address.line1, line2: address.line2, zip: address.zip } : null,
    appointmentEarliest: stop.appointmentEarliest,
    appointmentLatest: stop.appointmentLatest,
    status: stop.status,
  };
}

const baseFields = (load: LoadForSerialization) => ({
  id: load.id,
  loadNumber: load.loadNumber,
  status: load.status,
  mode: load.mode,
  equipmentType: load.equipmentType,
  commodity: load.commodity,
  weightLbs: load.weightLbs,
  specialInstructions: load.specialInstructions,
  createdAt: load.createdAt,
  updatedAt: load.updatedAt,
});

export type InternalLoadView = ReturnType<typeof baseFields> & {
  shipperCompany: { id: string; name: string };
  stops: StopView[];
  sellRate: number | null;
  buyRate: number | null;
  margin: number | null;
  cancelledReason: string | null;
  cancelledAt: Date | null;
};

/** Full detail — every field, every rate, real shipper identity. */
export function toInternalLoadView(load: LoadForSerialization): InternalLoadView {
  const sellRate = load.relations?.acceptedQuote?.sellRate;
  const buyRate = load.relations?.acceptedAssignment?.carrierRate;
  return {
    ...baseFields(load),
    shipperCompany: { id: load.shipperCompany.id, name: load.shipperCompany.dbaName ?? load.shipperCompany.legalName },
    stops: load.stops.map((s) => stopView(s, true)),
    sellRate: sellRate != null ? Number(sellRate) : null,
    buyRate: buyRate != null ? Number(buyRate) : null,
    margin: sellRate != null && buyRate != null ? Number(sellRate) - Number(buyRate) : null,
    cancelledReason: load.cancelledReason,
    cancelledAt: load.cancelledAt,
  };
}

export type ShipperLoadView = ReturnType<typeof baseFields> & {
  stops: StopView[];
  sellRate: number | null;
  cancelledReason: string | null;
};

/** The shipper's own load — sell rate only, never buy rate or margin. */
export function toShipperLoadView(load: LoadForSerialization): ShipperLoadView {
  const sellRate = load.relations?.acceptedQuote?.sellRate;
  return {
    ...baseFields(load),
    stops: load.stops.map((s) => stopView(s, true)),
    sellRate: sellRate != null ? Number(sellRate) : null,
    cancelledReason: load.cancelledReason,
  };
}

export type CarrierLoadView = ReturnType<typeof baseFields> & {
  shipperName: string | null;
  stops: StopView[];
  buyRate: number | null;
};

/**
 * A load this carrier is offered/assigned on — buy rate only, never sell
 * rate or margin. Shipper identity and exact stop addresses are redacted
 * (city/state only) until this carrier's assignment is `accepted`.
 */
export function toCarrierLoadView(load: LoadForSerialization): CarrierLoadView {
  const assignment = load.relations?.acceptedAssignment;
  const committed = assignment?.status === "accepted";
  return {
    ...baseFields(load),
    shipperName: committed ? (load.shipperCompany.dbaName ?? load.shipperCompany.legalName) : null,
    stops: load.stops.map((s) => stopView(s, committed)),
    buyRate: assignment?.carrierRate != null ? Number(assignment.carrierRate) : null,
  };
}
