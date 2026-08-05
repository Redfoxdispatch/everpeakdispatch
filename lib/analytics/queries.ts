import "server-only";
import { db } from "@/lib/db/client";

/**
 * All figures here are computed from `bookings`/`carrier_assignments`/
 * `load_stops` at query time — see context/06-development-roadmap.md Phase 8
 * exit criterion: "margin, on-time %, and carrier fall-off rate are computed
 * from real relational data, not hardcoded." Revenue/margin are the booked
 * sell rate (`bookings.confirmed_rate`, locked at booking time per
 * context/03-database-schema.md §4) minus the accepted carrier's buy rate —
 * this intentionally does not require a load to have reached `invoiced`/
 * `paid` yet, since a freshly-booked load's economics are already real.
 */

type Address = { city?: string; state?: string };

function parseAddress(value: unknown): Address {
  if (value && typeof value === "object") return value as Address;
  return {};
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getUTCMonth()]} '${String(date.getUTCFullYear()).slice(2)}`;
}

function monthsAgoUTC(n: number, from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - n, 1));
}

function startOfCurrentMonthUTC(): Date {
  return monthsAgoUTC(0);
}

// ─────────────────────────────────────────────────────────────
// On-time delivery
// ─────────────────────────────────────────────────────────────

export type OnTimeStats = { onTime: number; late: number; total: number; onTimePct: number | null };

function pctOf(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

/**
 * On-time = a `delivery`-type stop's `actual_arrival` at or before its
 * `appointment_latest` window — measured per delivery stop, not per load, so
 * a multi-stop route contributes one on-time/late event per delivery leg.
 */
export async function getOnTimeStats(filter: { shipperCompanyId?: string; carrierCompanyId?: string } = {}): Promise<OnTimeStats> {
  const stops = await db.loadStop.findMany({
    where: {
      stopType: "delivery",
      actualArrival: { not: null },
      load: {
        deletedAt: null,
        ...(filter.shipperCompanyId ? { shipperCompanyId: filter.shipperCompanyId } : {}),
        ...(filter.carrierCompanyId
          ? { carrierAssignments: { some: { carrierCompanyId: filter.carrierCompanyId, status: "accepted" } } }
          : {}),
      },
    },
    select: { actualArrival: true, appointmentLatest: true },
  });

  const total = stops.length;
  const onTime = stops.filter((s) => s.actualArrival! <= s.appointmentLatest).length;
  return { onTime, late: total - onTime, total, onTimePct: pctOf(onTime, total) };
}

// ─────────────────────────────────────────────────────────────
// Brokerage-wide KPIs (ops dashboard tiles)
// ─────────────────────────────────────────────────────────────

export type BrokerageKpis = {
  revenueThisMonth: number;
  marginThisMonth: number;
  bookedLoadsThisMonth: number;
  onTimePct: number | null;
  activeLoadCount: number;
};

export async function getBrokerageKpis(): Promise<BrokerageKpis> {
  const monthStart = startOfCurrentMonthUTC();

  const [bookings, onTime, activeLoadCount] = await Promise.all([
    db.booking.findMany({
      where: { bookedAt: { gte: monthStart }, load: { deletedAt: null } },
      select: {
        confirmedRate: true,
        load: { select: { carrierAssignments: { where: { status: "accepted" }, select: { carrierRate: true } } } },
      },
    }),
    getOnTimeStats(),
    db.load.count({ where: { deletedAt: null, status: { notIn: ["draft", "closed", "cancelled"] } } }),
  ]);

  let revenue = 0;
  let cost = 0;
  for (const b of bookings) {
    revenue += Number(b.confirmedRate);
    cost += b.load.carrierAssignments.reduce((sum, a) => sum + Number(a.carrierRate), 0);
  }

  return {
    revenueThisMonth: revenue,
    marginThisMonth: revenue - cost,
    bookedLoadsThisMonth: bookings.length,
    onTimePct: onTime.onTimePct,
    activeLoadCount,
  };
}

// ─────────────────────────────────────────────────────────────
// Margin trend (brokerage-wide, monthly)
// ─────────────────────────────────────────────────────────────

export type MarginTrendPoint = { month: string; label: string; revenue: number; cost: number; margin: number; loadCount: number };

export async function getMarginTrend(monthsBack = 6): Promise<MarginTrendPoint[]> {
  const since = monthsAgoUTC(monthsBack - 1);

  const bookings = await db.booking.findMany({
    where: { bookedAt: { gte: since }, load: { deletedAt: null } },
    select: {
      bookedAt: true,
      confirmedRate: true,
      load: { select: { carrierAssignments: { where: { status: "accepted" }, select: { carrierRate: true } } } },
    },
  });

  const buckets = new Map<string, MarginTrendPoint>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = monthsAgoUTC(i);
    const key = monthKey(d);
    buckets.set(key, { month: key, label: monthLabel(d), revenue: 0, cost: 0, margin: 0, loadCount: 0 });
  }

  for (const b of bookings) {
    const bucket = buckets.get(monthKey(b.bookedAt));
    if (!bucket) continue;
    const revenue = Number(b.confirmedRate);
    const cost = b.load.carrierAssignments.reduce((sum, a) => sum + Number(a.carrierRate), 0);
    bucket.revenue += revenue;
    bucket.cost += cost;
    bucket.margin += revenue - cost;
    bucket.loadCount += 1;
  }

  return [...buckets.values()];
}

// ─────────────────────────────────────────────────────────────
// Revenue by shipper / lane (brokerage-wide)
// ─────────────────────────────────────────────────────────────

export type ShipperRevenueRow = { shipperCompanyId: string; shipperName: string; revenue: number; loadCount: number };

export async function getRevenueByShipper(monthsBack = 6): Promise<ShipperRevenueRow[]> {
  const since = monthsAgoUTC(monthsBack - 1);

  const bookings = await db.booking.findMany({
    where: { bookedAt: { gte: since }, load: { deletedAt: null } },
    select: {
      confirmedRate: true,
      load: { select: { shipperCompanyId: true, shipperCompany: { select: { legalName: true, dbaName: true } } } },
    },
  });

  const map = new Map<string, ShipperRevenueRow>();
  for (const b of bookings) {
    const id = b.load.shipperCompanyId;
    const existing = map.get(id) ?? {
      shipperCompanyId: id,
      shipperName: b.load.shipperCompany.dbaName ?? b.load.shipperCompany.legalName,
      revenue: 0,
      loadCount: 0,
    };
    existing.revenue += Number(b.confirmedRate);
    existing.loadCount += 1;
    map.set(id, existing);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export type LaneRevenueRow = { lane: string; revenue: number; loadCount: number };

export async function getRevenueByLane(monthsBack = 6): Promise<LaneRevenueRow[]> {
  const since = monthsAgoUTC(monthsBack - 1);

  const bookings = await db.booking.findMany({
    where: { bookedAt: { gte: since }, load: { deletedAt: null } },
    select: {
      confirmedRate: true,
      load: { select: { stops: { orderBy: { sequence: "asc" } } } },
    },
  });

  const map = new Map<string, LaneRevenueRow>();
  for (const b of bookings) {
    const pickup = b.load.stops.find((s) => s.stopType === "pickup");
    const deliveries = b.load.stops.filter((s) => s.stopType === "delivery");
    const delivery = deliveries[deliveries.length - 1];
    if (!pickup || !delivery) continue;

    const pAddr = parseAddress(pickup.address);
    const dAddr = parseAddress(delivery.address);
    const lane = `${pAddr.city ?? "Unknown"}, ${pAddr.state ?? "?"} → ${dAddr.city ?? "Unknown"}, ${dAddr.state ?? "?"}`;

    const existing = map.get(lane) ?? { lane, revenue: 0, loadCount: 0 };
    existing.revenue += Number(b.confirmedRate);
    existing.loadCount += 1;
    map.set(lane, existing);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

// ─────────────────────────────────────────────────────────────
// Carrier scorecards (brokerage-wide — one pass for every carrier)
// ─────────────────────────────────────────────────────────────

export type CarrierScorecard = {
  totalOffered: number;
  accepted: number;
  declined: number;
  fellOff: number;
  fallOffRatePct: number | null;
  onTimePct: number | null;
  completedDeliveries: number;
};

function emptyScorecard(): CarrierScorecard {
  return { totalOffered: 0, accepted: 0, declined: 0, fellOff: 0, fallOffRatePct: null, onTimePct: null, completedDeliveries: 0 };
}

/**
 * Fall-off rate is scoped to assignments the carrier actually committed to
 * (`accepted` now, or `fell_off` — which per context/01-business-workflow.md
 * §4.4 only ever transitions FROM `accepted`), not the full offered pool —
 * declining an offer up front is a normal, healthy outcome, not a fall-off.
 */
export async function getCarrierScorecards(): Promise<Map<string, CarrierScorecard>> {
  const grouped = await db.carrierAssignment.groupBy({
    by: ["carrierCompanyId", "status"],
    _count: { _all: true },
  });

  const map = new Map<string, CarrierScorecard>();
  for (const row of grouped) {
    const entry = map.get(row.carrierCompanyId) ?? emptyScorecard();
    entry.totalOffered += row._count._all;
    if (row.status === "accepted") entry.accepted += row._count._all;
    if (row.status === "declined") entry.declined += row._count._all;
    if (row.status === "fell_off") entry.fellOff += row._count._all;
    map.set(row.carrierCompanyId, entry);
  }
  for (const entry of map.values()) {
    entry.fallOffRatePct = pctOf(entry.fellOff, entry.accepted + entry.fellOff);
  }

  const stops = await db.loadStop.findMany({
    where: {
      stopType: "delivery",
      actualArrival: { not: null },
      load: { deletedAt: null, carrierAssignments: { some: { status: "accepted" } } },
    },
    select: {
      actualArrival: true,
      appointmentLatest: true,
      load: { select: { carrierAssignments: { where: { status: "accepted" }, select: { carrierCompanyId: true } } } },
    },
  });

  const onTimeCounts = new Map<string, { onTime: number; total: number }>();
  for (const stop of stops) {
    const carrierId = stop.load.carrierAssignments[0]?.carrierCompanyId;
    if (!carrierId) continue;
    const counter = onTimeCounts.get(carrierId) ?? { onTime: 0, total: 0 };
    counter.total += 1;
    if (stop.actualArrival! <= stop.appointmentLatest) counter.onTime += 1;
    onTimeCounts.set(carrierId, counter);
  }
  for (const [carrierId, counter] of onTimeCounts) {
    const entry = map.get(carrierId) ?? emptyScorecard();
    entry.onTimePct = pctOf(counter.onTime, counter.total);
    entry.completedDeliveries = counter.total;
    map.set(carrierId, entry);
  }

  return map;
}

export type CarrierPerformanceRow = CarrierScorecard & { carrierCompanyId: string; carrierName: string };

/**
 * Scorecards joined with carrier names, sorted by delivery volume desc — for
 * the ops Analytics page's carrier performance table. Only includes carriers
 * with at least one assignment (an empty scorecard for a carrier that's
 * never been offered a load isn't reportable).
 */
export async function getCarrierPerformanceRows(): Promise<CarrierPerformanceRow[]> {
  const scorecards = await getCarrierScorecards();
  const carrierIds = [...scorecards.keys()];
  if (carrierIds.length === 0) return [];

  const companies = await db.company.findMany({
    where: { id: { in: carrierIds }, type: "carrier" },
    select: { id: true, legalName: true, dbaName: true },
  });

  return companies
    .map((c) => ({ carrierCompanyId: c.id, carrierName: c.dbaName ?? c.legalName, ...scorecards.get(c.id)! }))
    .sort((a, b) => b.completedDeliveries - a.completedDeliveries || b.accepted - a.accepted);
}

// ─────────────────────────────────────────────────────────────
// Shipper-facing report (own shipments only — sell rate, never margin/buy rate)
// ─────────────────────────────────────────────────────────────

export type ShipperReport = {
  totalSpend: number;
  loadCount: number;
  onTimePct: number | null;
  monthlySpend: { month: string; label: string; amount: number; loadCount: number }[];
};

export async function getShipperReport(shipperCompanyId: string, monthsBack = 6): Promise<ShipperReport> {
  const since = monthsAgoUTC(monthsBack - 1);

  const [bookings, onTime] = await Promise.all([
    db.booking.findMany({
      where: { bookedAt: { gte: since }, load: { shipperCompanyId, deletedAt: null } },
      select: { bookedAt: true, confirmedRate: true },
    }),
    getOnTimeStats({ shipperCompanyId }),
  ]);

  const buckets = new Map<string, { label: string; amount: number; loadCount: number }>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = monthsAgoUTC(i);
    buckets.set(monthKey(d), { label: monthLabel(d), amount: 0, loadCount: 0 });
  }
  let totalSpend = 0;
  for (const b of bookings) {
    const amount = Number(b.confirmedRate);
    totalSpend += amount;
    const bucket = buckets.get(monthKey(b.bookedAt));
    if (bucket) {
      bucket.amount += amount;
      bucket.loadCount += 1;
    }
  }

  return {
    totalSpend,
    loadCount: bookings.length,
    onTimePct: onTime.onTimePct,
    monthlySpend: [...buckets.entries()].map(([month, v]) => ({ month, ...v })),
  };
}

// ─────────────────────────────────────────────────────────────
// Carrier-facing report (own loads only — buy rate, their own rate only)
// ─────────────────────────────────────────────────────────────

export type CarrierReport = {
  totalEarnings: number;
  loadCount: number;
  onTimePct: number | null;
  fallOffRatePct: number | null;
  monthlyEarnings: { month: string; label: string; amount: number; loadCount: number }[];
};

export async function getCarrierReport(carrierCompanyId: string, monthsBack = 6): Promise<CarrierReport> {
  const since = monthsAgoUTC(monthsBack - 1);

  const [acceptedAssignments, onTime, fallOffGroups] = await Promise.all([
    db.carrierAssignment.findMany({
      where: { carrierCompanyId, status: "accepted", respondedAt: { gte: since } },
      select: { respondedAt: true, carrierRate: true },
    }),
    getOnTimeStats({ carrierCompanyId }),
    db.carrierAssignment.groupBy({
      by: ["status"],
      where: { carrierCompanyId, status: { in: ["accepted", "fell_off"] } },
      _count: { _all: true },
    }),
  ]);

  const accepted = fallOffGroups.find((r) => r.status === "accepted")?._count._all ?? 0;
  const fellOff = fallOffGroups.find((r) => r.status === "fell_off")?._count._all ?? 0;

  const buckets = new Map<string, { label: string; amount: number; loadCount: number }>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = monthsAgoUTC(i);
    buckets.set(monthKey(d), { label: monthLabel(d), amount: 0, loadCount: 0 });
  }
  let totalEarnings = 0;
  for (const a of acceptedAssignments) {
    const amount = Number(a.carrierRate);
    totalEarnings += amount;
    const bucket = buckets.get(monthKey(a.respondedAt!));
    if (bucket) {
      bucket.amount += amount;
      bucket.loadCount += 1;
    }
  }

  return {
    totalEarnings,
    loadCount: acceptedAssignments.length,
    onTimePct: onTime.onTimePct,
    fallOffRatePct: pctOf(fellOff, accepted + fellOff),
    monthlyEarnings: [...buckets.entries()].map(([month, v]) => ({ month, ...v })),
  };
}
