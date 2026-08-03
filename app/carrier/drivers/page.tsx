import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { StatusTone } from "@/lib/status";
import { DriverForm } from "./driver-form";
import { DriverStatusSelect } from "./status-select";

function licenseMeta(expiry: Date | null): { label: string; tone: StatusTone } | null {
  if (!expiry) return null;
  const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0) return { label: "Expired", tone: "red" };
  if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry}d`, tone: "amber" };
  return { label: "Current", tone: "green" };
}

export default async function CarrierDriversPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const drivers = await db.driver.findMany({ where: { carrierId: user.companyId }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <DriverForm />

      <div className="mt-6">
        {drivers.length === 0 ? (
          <EmptyState icon={Users} title="No drivers yet" description="Add drivers so you can assign them to loads." />
        ) : (
          <ul className="space-y-2">
            {drivers.map((d) => {
              const meta = licenseMeta(d.licenseExpiry);
              return (
                <li key={d.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <div className="font-medium">{d.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.phone ?? "No phone on file"}
                      {d.licenseNumber ? ` · License ${d.licenseNumber}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meta ? <StatusBadge meta={meta} /> : null}
                    <DriverStatusSelect driverId={d.id} status={d.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
