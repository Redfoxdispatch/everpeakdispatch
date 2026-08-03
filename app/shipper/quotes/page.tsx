import { redirect } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { QuoteResponse } from "@/components/shipper/quote-response";

export default async function ShipperQuotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const quotes = await db.quote.findMany({
    where: { load: { shipperCompanyId: user.companyId }, status: "pending" },
    include: { load: true },
    orderBy: { validUntil: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Quotes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Review and respond to quotes on your shipment requests.</p>

      <div className="mt-6">
        {quotes.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No quotes awaiting your response"
            description="When our team quotes one of your shipment requests, it will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {quotes.map((q) => {
              const expired = q.validUntil < new Date();
              return (
                <li key={q.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/shipper/shipments/${q.loadId}`} className="font-medium text-primary hover:underline">
                      {q.load.loadNumber}
                    </Link>
                    <span className="text-sm font-semibold">
                      ${Number(q.sellRate).toLocaleString()} {q.currency}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                    Valid until {q.validUntil.toLocaleString()}
                    {expired ? " — expired" : ""}
                  </div>
                  {q.notes ? <div className="mt-1 text-xs">{q.notes}</div> : null}
                  <QuoteResponse
                    quote={{
                      id: q.id,
                      loadId: q.loadId,
                      version: q.version,
                      sellRate: Number(q.sellRate),
                      currency: q.currency,
                      validUntil: q.validUntil.toISOString(),
                      status: q.status,
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
