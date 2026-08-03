import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { ShipmentForm } from "./shipment-form";

export default async function NewShipmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await can(user, "loads:create"))) redirect("/shipper/dashboard");

  const equipmentTypes = await db.equipmentType.findMany({ where: { active: true }, orderBy: { label: "asc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Request a shipment</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Submit the pickup and delivery details — our team will review and send you a quote.
      </p>
      <div className="mt-6">
        <ShipmentForm equipmentTypes={equipmentTypes} />
      </div>
    </div>
  );
}
