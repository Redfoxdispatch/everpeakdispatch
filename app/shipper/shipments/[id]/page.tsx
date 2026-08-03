import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { toShipperLoadView } from "@/lib/permissions/load-dto";
import { StatusBadge } from "@/components/shared/status-badge";
import { LOAD_STATUS_META, QUOTE_STATUS_META, DOCUMENT_STATUS_META } from "@/lib/status";
import { QuoteResponse } from "@/components/shipper/quote-response";
import { DocumentUploadForm } from "./document-upload-form";
import { InvoiceSection } from "./invoice-section";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  rate_confirmation: "Rate Confirmation",
  insurance_certificate: "Insurance Certificate",
  w9: "W-9",
  invoice: "Invoice",
  other: "Other",
};

const TRACKING_EVENT_LABEL: Record<string, string> = {
  status_change: "Status update",
  location_update: "Location update",
  exception: "Exception",
  note: "Note",
};

export default async function ShipperShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const load = await db.load.findUnique({
    where: { id, deletedAt: null },
    include: {
      shipperCompany: true,
      stops: { orderBy: { sequence: "asc" } },
      acceptedQuote: { select: { sellRate: true, currency: true } },
    },
  });

  if (!load || load.shipperCompanyId !== user.companyId) notFound();

  const [quotes, documents, invoice, trackingEvents] = await Promise.all([
    db.quote.findMany({ where: { loadId: load.id }, orderBy: { version: "desc" } }),
    db.document.findMany({ where: { loadId: load.id, visibility: { in: ["shipper", "public"] } }, orderBy: { createdAt: "desc" } }),
    db.invoice.findFirst({ where: { loadId: load.id, type: "shipper_invoice" } }),
    db.trackingEvent.findMany({ where: { loadId: load.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const view = toShipperLoadView({ ...load, relations: { acceptedQuote: load.acceptedQuote } });

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{view.loadNumber}</h1>
          <StatusBadge meta={LOAD_STATUS_META[view.status]} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {view.mode.toUpperCase()} · {view.equipmentType.replace("_", " ")} · {view.weightLbs.toLocaleString()} lbs
        </p>
        {view.sellRate != null ? <p className="mt-1 text-sm font-medium">Rate: ${view.sellRate.toLocaleString()}</p> : null}
        {view.cancelledReason ? <p className="mt-2 text-sm text-destructive">Cancelled: {view.cancelledReason}</p> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Stops</h2>
          <ul className="mt-3 space-y-3">
            {view.stops.map((stop) => (
              <li key={stop.sequence} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    Stop {stop.sequence} — {stop.stopType}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stop.fullAddress?.line1 ? `${stop.fullAddress.line1}, ` : ""}
                  {stop.city}, {stop.state}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {stop.appointmentEarliest.toLocaleString()} – {stop.appointmentLatest.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Tracking</h2>
          {trackingEvents.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {trackingEvents.map((event) => (
                <li key={event.id} className="border-l-2 border-primary/40 pl-3">
                  <div className="text-sm font-medium">
                    {event.status ? LOAD_STATUS_META[event.status as keyof typeof LOAD_STATUS_META]?.label ?? event.status : TRACKING_EVENT_LABEL[event.eventType]}
                  </div>
                  {event.description ? <div className="text-xs text-muted-foreground">{event.description}</div> : null}
                  <div className="text-xs text-muted-foreground">{event.createdAt.toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Quotes</h2>
          {quotes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No quotes yet — our team will review your request.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {quotes.map((q) => (
                <li key={q.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      v{q.version} — ${Number(q.sellRate).toLocaleString()} {q.currency}
                    </div>
                    <StatusBadge meta={QUOTE_STATUS_META[q.status]} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Valid until {q.validUntil.toLocaleString()}</div>
                  {q.notes ? <div className="mt-1 text-xs">{q.notes}</div> : null}
                  <QuoteResponse
                    quote={{
                      id: q.id,
                      loadId: load.id,
                      version: q.version,
                      sellRate: Number(q.sellRate),
                      currency: q.currency,
                      validUntil: q.validUntil.toISOString(),
                      status: q.status,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <InvoiceSection
            invoice={
              invoice
                ? {
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    totalAmount: Number(invoice.totalAmount),
                    amountPaid: Number(invoice.amountPaid),
                    dueDate: invoice.dueDate.toISOString(),
                    status: invoice.status,
                    disputeReason: invoice.disputeReason,
                  }
                : null
            }
          />
        </div>

        <div className="rounded-lg border p-4 lg:col-span-2">
          <DocumentUploadForm loadId={load.id} />
          {documents.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                  <div className="font-medium">{DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}</div>
                  <StatusBadge meta={DOCUMENT_STATUS_META[d.status]} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No documents yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
