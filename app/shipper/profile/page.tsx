import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { COMPANY_STATUS_META } from "@/lib/status";

export default async function ShipperProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const company = await db.company.findUnique({
    where: { id: user.companyId },
    include: { shipperProfile: true },
  });
  if (!company) redirect("/login");

  const address = company.billingAddress as { line1?: string; city?: string; state?: string; zip?: string } | null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your account and company details.</p>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Your account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="capitalize">{user.role.replace("_", " ")}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Company</h2>
          <StatusBadge meta={COMPANY_STATUS_META[company.status]} />
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Legal name</dt>
            <dd>{company.legalName}</dd>
          </div>
          {company.dbaName ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">DBA</dt>
              <dd>{company.dbaName}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{company.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Billing address</dt>
            <dd className="text-right">
              {address?.line1 ? `${address.line1}, ${address.city}, ${address.state} ${address.zip}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Payment terms</dt>
            <dd>{company.shipperProfile?.paymentTermsDays ?? 30} days</dd>
          </div>
          {company.shipperProfile?.industry ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Industry</dt>
              <dd>{company.shipperProfile.industry}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          To update company details or add additional users, contact your broker.
        </p>
      </div>
    </div>
  );
}
