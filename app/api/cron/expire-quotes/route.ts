import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/client";
import { isAuthorizedCronRequest } from "@/lib/cron/verify";
import { notifyCompany } from "@/lib/notifications/create";

/**
 * context/04-application-architecture.md §7: every 15 min, sweep pending
 * quotes past their valid_until and flip them to expired. A scheduled
 * sweep is required (not just a read-time check) because an
 * expired-but-unmarked quote could otherwise still be "accepted" by a
 * shipper in a race — see context/01-business-workflow.md §4.3.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleQuotes = await db.quote.findMany({
    where: { status: "pending", validUntil: { lt: new Date() } },
    include: { load: { select: { id: true, loadNumber: true, shipperCompanyId: true } } },
  });

  for (const quote of staleQuotes) {
    await db.quote.update({ where: { id: quote.id }, data: { status: "expired" } });
    await notifyCompany(quote.load.shipperCompanyId, {
      type: "quote_expired",
      title: `Quote expired for ${quote.load.loadNumber}`,
      body: `Your quote (v${quote.version}) expired without a response. Contact your broker for a new one.`,
      link: `/shipper/shipments/${quote.load.id}`,
    });
  }

  return NextResponse.json({ expired: staleQuotes.length });
}
