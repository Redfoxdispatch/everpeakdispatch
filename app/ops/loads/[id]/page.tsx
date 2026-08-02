import { notFound, redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { toInternalLoadView } from "@/lib/permissions/load-dto";
import { StatusBadge } from "@/components/shared/status-badge";
import { LOAD_STATUS_META } from "@/lib/status";
import { StatusControls } from "./status-controls";
import { QuotePanel } from "./quote-panel";
import { AssignmentPanel } from "./assignment-panel";
import { DocumentPanel } from "./document-panel";
import { InvoicePanel } from "./invoice-panel";

export default async function OpsLoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "loads:read:all"))) redirect("/ops/dashboard");

  const { id } = await params;
  const load = await db.load.findUnique({
    where: { id, deletedAt: null },
    include: {
      shipperCompany: true,
      stops: { orderBy: { sequence: "asc" } },
      acceptedQuote: { select: { sellRate: true, currency: true } },
      carrierAssignments: {
        where: { status: "accepted" },
        select: { carrierRate: true, status: true, carrierCompanyId: true },
      },
    },
  });

  if (!load) notFound();

  const [quotes, assignments, eligibleCarriers, documents] = await Promise.all([
    db.quote.findMany({ where: { loadId: load.id }, orderBy: { version: "desc" } }),
    db.carrierAssignment.findMany({
      where: { loadId: load.id },
      include: { carrierCompany: true },
      orderBy: { offeredAt: "desc" },
    }),
    db.company.findMany({
      where: {
        type: "carrier",
        status: "active",
        carrierProfile: { authorityStatus: "active", insuranceExpiryDate: { gt: new Date() } },
      },
      select: { id: true, legalName: true, dbaName: true },
      orderBy: { legalName: "asc" },
    }),
    db.document.findMany({ where: { loadId: load.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const invoices = await db.invoice.findMany({ where: { loadId: load.id } });
  const canQuote = await can(user, "quotes:create");
  const canAssign = await can(user, "carrier_assignments:create");
  const canUploadDocuments = await can(user, "documents:upload");
  const canIssueInvoices = await can(user, "invoices:issue");
  const canRecordPayment = await can(user, "payments:record");

  const view = toInternalLoadView({
    ...load,
    relations: {
      acceptedQuote: load.acceptedQuote,
      acceptedAssignment: load.carrierAssignments[0] ?? null,
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{view.loadNumber}</h1>
            <StatusBadge meta={LOAD_STATUS_META[view.status]} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {view.shipperCompany.name} · {view.mode.toUpperCase()} · {view.equipmentType.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <StatusControls loadId={view.id} status={load.status} />
      </div>

      {view.cancelledReason ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="font-medium">Cancelled:</span> {view.cancelledReason}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Freight details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Commodity</dt>
              <dd>{view.commodity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Weight</dt>
              <dd>{view.weightLbs.toLocaleString()} lbs</dd>
            </div>
            {view.specialInstructions ? (
              <div className="pt-2">
                <dt className="text-muted-foreground">Special instructions</dt>
                <dd className="mt-1">{view.specialInstructions}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Rates</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sell rate</dt>
              <dd>{view.sellRate != null ? `$${view.sellRate.toLocaleString()}` : "Not quoted yet"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Buy rate</dt>
              <dd>{view.buyRate != null ? `$${view.buyRate.toLocaleString()}` : "No carrier assigned yet"}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <dt>Margin</dt>
              <dd>{view.margin != null ? `$${view.margin.toLocaleString()}` : "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Stops</h2>
        <ol className="mt-3 space-y-4">
          {view.stops.map((stop) => (
            <li key={stop.sequence} className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="text-sm">
                <div className="font-medium capitalize">
                  {stop.stopType} — {stop.city}, {stop.state}
                </div>
                {stop.fullAddress?.line1 ? (
                  <div className="text-xs text-muted-foreground">
                    {stop.fullAddress.line1}
                    {stop.fullAddress.line2 ? `, ${stop.fullAddress.line2}` : ""}, {stop.fullAddress.zip}
                  </div>
                ) : null}
                <div className="mt-1 text-xs text-muted-foreground">
                  {stop.appointmentEarliest.toLocaleString()} – {stop.appointmentLatest.toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <QuotePanel
          loadId={view.id}
          canQuote={canQuote}
          quotes={quotes.map((q) => ({
            id: q.id,
            version: q.version,
            sellRate: Number(q.sellRate),
            currency: q.currency,
            validUntil: q.validUntil.toISOString(),
            status: q.status,
            notes: q.notes,
          }))}
        />
        <AssignmentPanel
          loadId={view.id}
          canAssign={canAssign}
          eligibleCarriers={eligibleCarriers.map((c) => ({ id: c.id, name: c.dbaName ?? c.legalName }))}
          assignments={assignments.map((a) => ({
            id: a.id,
            carrierName: a.carrierCompany.dbaName ?? a.carrierCompany.legalName,
            carrierRate: Number(a.carrierRate),
            status: a.status,
            fellOffReason: a.fellOffReason,
          }))}
        />
      </div>

      <div className="mt-6">
        <DocumentPanel
          loadId={view.id}
          canUpload={canUploadDocuments}
          documents={documents.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            visibility: d.visibility,
            status: d.status,
            rejectedReason: d.rejectedReason,
          }))}
        />
      </div>

      <div className="mt-6">
        <InvoicePanel
          loadId={view.id}
          canIssue={canIssueInvoices}
          canRecordPayment={canRecordPayment}
          invoices={invoices.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            type: i.type,
            totalAmount: Number(i.totalAmount),
            amountPaid: Number(i.amountPaid),
            status: i.status,
          }))}
        />
      </div>
    </div>
  );
}
