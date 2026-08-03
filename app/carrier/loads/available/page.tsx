import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { toCarrierLoadView } from "@/lib/permissions/load-dto";
import { EmptyState } from "@/components/shared/empty-state";
import { OfferResponse } from "@/components/carrier/offer-response";

export default async function CarrierAvailableLoadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const offers = await db.carrierAssignment.findMany({
    where: { carrierCompanyId: user.companyId, status: "offered" },
    include: {
      load: {
        include: { shipperCompany: true, stops: { orderBy: { sequence: "asc" } } },
      },
    },
    orderBy: { offeredAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Available Loads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Loads offered to your company — accept or decline.</p>

      <div className="mt-6">
        {offers.length === 0 ? (
          <EmptyState icon={Truck} title="No loads offered right now" description="New offers from brokers will show up here." />
        ) : (
          <ul className="space-y-3">
            {offers.map(({ load, ...assignment }) => {
              const view = toCarrierLoadView({
                ...load,
                relations: { acceptedAssignment: { carrierRate: assignment.carrierRate, status: assignment.status, carrierCompanyId: assignment.carrierCompanyId } },
              });
              const pickup = view.stops.find((s) => s.stopType === "pickup");
              const delivery = view.stops[view.stops.length - 1];
              return (
                <li key={assignment.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{view.loadNumber}</span>
                    <span className="text-sm font-semibold">${view.buyRate?.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {pickup?.city}, {pickup?.state} → {delivery?.city}, {delivery?.state}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {view.mode.toUpperCase()} · {view.equipmentType.replace("_", " ")} · {view.weightLbs.toLocaleString()} lbs
                  </div>
                  <OfferResponse loadId={load.id} assignmentId={assignment.id} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
