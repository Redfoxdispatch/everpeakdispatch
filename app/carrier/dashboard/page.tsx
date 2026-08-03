import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { LOAD_STATUS_META } from "@/lib/status";

function Tile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border p-4 transition-colors hover:border-ring">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Link>
  );
}

export default async function CarrierDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [availableLoads, activeLoads, carrierProfile, recentAssignments] = await Promise.all([
    db.carrierAssignment.count({ where: { carrierCompanyId: user.companyId, status: "offered" } }),
    db.carrierAssignment.count({ where: { carrierCompanyId: user.companyId, status: "accepted" } }),
    db.carrierProfile.findUnique({ where: { companyId: user.companyId } }),
    db.carrierAssignment.findMany({
      where: { carrierCompanyId: user.companyId, status: "accepted" },
      include: { load: true },
      orderBy: { respondedAt: "desc" },
      take: 5,
    }),
  ]);

  const insuranceDaysLeft = carrierProfile
    ? Math.floor((carrierProfile.insuranceExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const complianceAlert = insuranceDaysLeft != null && insuranceDaysLeft <= 30;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Carrier Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome, {user.fullName}.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Available loads" value={availableLoads} href="/carrier/loads/available" />
        <Tile label="Active loads" value={activeLoads} href="/carrier/loads" />
        <Tile label="Compliance alerts" value={complianceAlert ? 1 : 0} href="/carrier/documents" />
      </div>

      {complianceAlert ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {insuranceDaysLeft! < 0
            ? "Your insurance has expired — you cannot be offered new loads until it's renewed."
            : `Your insurance expires in ${insuranceDaysLeft} day${insuranceDaysLeft === 1 ? "" : "s"} — renew it to keep receiving load offers.`}
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Upcoming pickups</h2>
        {recentAssignments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No active loads yet — check Available Loads for new offers.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentAssignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <Link href={`/carrier/loads/${a.load.id}`} className="font-medium text-primary hover:underline">
                  {a.load.loadNumber}
                </Link>
                <StatusBadge meta={LOAD_STATUS_META[a.load.status]} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
