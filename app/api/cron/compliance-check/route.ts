import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { isAuthorizedCronRequest } from "@/lib/cron/verify";
import { notifyCompany, notifyRoles } from "@/lib/notifications/create";

/**
 * context/04-application-architecture.md §7: daily, flag carriers whose
 * insurance expires within 7 days. This is a notification only — carriers
 * with expired insurance are already excluded from new offers by a live
 * query filter in app/ops/loads/[id]/assignment-actions.ts (offerToCarrier),
 * so exclusion doesn't depend on this job running.
 */
const WARNING_WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const expiringCarriers = await db.carrierProfile.findMany({
    where: { insuranceExpiryDate: { gte: now, lte: windowEnd } },
    include: { company: { select: { id: true, legalName: true, dbaName: true } } },
  });

  for (const carrier of expiringCarriers) {
    const daysLeft = Math.ceil((carrier.insuranceExpiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const name = carrier.company.dbaName ?? carrier.company.legalName;

    await notifyCompany(carrier.companyId, {
      type: "compliance_expiring",
      title: "Your insurance is expiring soon",
      body: `Your insurance certificate expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Upload a renewed certificate to keep receiving load offers.`,
      link: "/carrier/documents",
    });
    await notifyRoles(["broker", "brokerage_admin"], {
      type: "compliance_expiring",
      title: `${name}'s insurance expires in ${daysLeft}d`,
      body: "They'll be excluded from new load offers once it lapses.",
      link: "/ops/carriers",
    });
  }

  return NextResponse.json({ flagged: expiringCarriers.length });
}
