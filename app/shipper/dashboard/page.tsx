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

export default async function ShipperDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [activeShipments, quotesAwaiting, overdueInvoices, recentLoads] = await Promise.all([
    db.load.count({ where: { shipperCompanyId: user.companyId, deletedAt: null, status: { notIn: ["closed", "cancelled"] } } }),
    db.quote.count({ where: { load: { shipperCompanyId: user.companyId }, status: "pending", validUntil: { gt: new Date() } } }),
    db.invoice.count({ where: { companyId: user.companyId, type: "shipper_invoice", status: { in: ["sent", "overdue"] }, dueDate: { lt: new Date() } } }),
    db.load.findMany({
      where: { shipperCompanyId: user.companyId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shipper Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome, {user.fullName}.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Active shipments" value={activeShipments} href="/shipper/shipments" />
        <Tile label="Quotes awaiting your response" value={quotesAwaiting} href="/shipper/quotes" />
        <Tile label="Overdue invoices" value={overdueInvoices} href="/shipper/invoices" />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        {recentLoads.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No shipments yet.{" "}
            <Link href="/shipper/shipments/new" className="text-primary hover:underline">
              Request your first shipment
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentLoads.map((load) => (
              <li key={load.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <Link href={`/shipper/shipments/${load.id}`} className="font-medium text-primary hover:underline">
                  {load.loadNumber}
                </Link>
                <StatusBadge meta={LOAD_STATUS_META[load.status]} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
