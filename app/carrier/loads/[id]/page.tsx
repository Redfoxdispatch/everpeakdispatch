import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { toCarrierLoadView } from "@/lib/permissions/load-dto";
import { StatusBadge } from "@/components/shared/status-badge";
import { LOAD_STATUS_META, DOCUMENT_STATUS_META } from "@/lib/status";
import { CarrierStatusControls } from "./status-controls";
import { StaffingForm } from "./staffing-form";
import { DocumentUploadForm } from "@/components/shared/document-upload-form";
import { DOCUMENT_TYPE_LABEL } from "@/lib/storage/documents";
import type { DocumentType } from "@/lib/generated/prisma/client";

const CARRIER_LOAD_DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "bol", label: DOCUMENT_TYPE_LABEL.bol },
  { value: "pod", label: DOCUMENT_TYPE_LABEL.pod },
];

export default async function CarrierShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const assignment = await db.carrierAssignment.findFirst({
    where: { loadId: id, carrierCompanyId: user.companyId },
    orderBy: { offeredAt: "desc" },
    include: {
      load: { include: { shipperCompany: true, stops: { orderBy: { sequence: "asc" } } } },
      driver: true,
      vehicle: true,
    },
  });
  if (!assignment) notFound();
  if (assignment.status !== "accepted") redirect("/carrier/loads/available");

  const [drivers, vehicles, documents] = await Promise.all([
    db.driver.findMany({ where: { carrierId: user.companyId, status: "active" }, orderBy: { fullName: "asc" } }),
    db.vehicle.findMany({ where: { carrierId: user.companyId, status: "active" }, orderBy: { plateNumber: "asc" } }),
    db.document.findMany({ where: { loadId: id, visibility: { in: ["carrier", "public"] } }, orderBy: { createdAt: "desc" } }),
  ]);

  const view = toCarrierLoadView({
    ...assignment.load,
    relations: {
      acceptedAssignment: {
        carrierRate: assignment.carrierRate,
        status: assignment.status,
        carrierCompanyId: assignment.carrierCompanyId,
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{view.loadNumber}</h1>
          <StatusBadge meta={LOAD_STATUS_META[view.status]} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {view.shipperName ?? "Shipper"} · {view.mode.toUpperCase()} · {view.equipmentType.replace("_", " ")} ·{" "}
          {view.weightLbs.toLocaleString()} lbs
        </p>
        {view.buyRate != null ? <p className="mt-1 text-sm font-medium">Rate: ${view.buyRate.toLocaleString()}</p> : null}
      </div>

      <div className="mt-6">
        <CarrierStatusControls loadId={assignment.loadId} assignmentId={assignment.id} status={view.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Stops</h2>
          <ul className="mt-3 space-y-3">
            {view.stops.map((stop) => (
              <li key={stop.sequence} className="rounded-md border p-3">
                <div className="text-sm font-medium capitalize">
                  Stop {stop.sequence} — {stop.stopType}
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
          <h2 className="text-sm font-semibold">Driver & vehicle</h2>
          <div className="mt-3">
            <StaffingForm
              loadId={assignment.loadId}
              assignmentId={assignment.id}
              drivers={drivers}
              vehicles={vehicles}
              currentDriverId={assignment.driverId}
              currentVehicleId={assignment.vehicleId}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 lg:col-span-2">
          <DocumentUploadForm loadId={assignment.loadId} documentTypes={CARRIER_LOAD_DOCUMENT_TYPES} />
          {documents.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                  <Link href={`/api/documents/${d.id}/download`} className="font-medium text-primary hover:underline">
                    {DOCUMENT_TYPE_LABEL[d.documentType] ?? d.documentType}
                  </Link>
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
