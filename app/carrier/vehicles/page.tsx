import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { VehicleForm } from "./vehicle-form";
import { VehicleStatusSelect } from "./status-select";

export default async function CarrierVehiclesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [vehicles, equipmentTypes] = await Promise.all([
    db.vehicle.findMany({ where: { carrierId: user.companyId }, include: { equipment: true }, orderBy: { createdAt: "desc" } }),
    db.equipmentType.findMany({ where: { active: true }, orderBy: { label: "asc" } }),
  ]);

  return (
    <div>
      <VehicleForm equipmentTypes={equipmentTypes} />

      <div className="mt-6">
        {vehicles.length === 0 ? (
          <EmptyState icon={Truck} title="No vehicles yet" description="Add your fleet so you can assign vehicles to loads." />
        ) : (
          <ul className="space-y-2">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <div className="font-medium">{v.plateNumber ?? "No plate on file"}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.equipment.label}
                    {v.capacityWeightLbs ? ` · ${v.capacityWeightLbs.toLocaleString()} lbs capacity` : ""}
                    {v.vin ? ` · VIN ${v.vin}` : ""}
                  </div>
                </div>
                <VehicleStatusSelect vehicleId={v.id} status={v.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
