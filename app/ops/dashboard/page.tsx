import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";

function Tile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border p-4 transition-colors hover:border-ring">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Link>
  );
}

export default async function OpsDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [needsQuote, pendingApproval, sourcingCarrier, pendingDocuments, pendingCompanies] = await Promise.all([
    db.load.count({ where: { deletedAt: null, status: { in: ["draft", "quote_requested"] } } }),
    db.quote.count({ where: { status: "pending", validUntil: { gt: new Date() } } }),
    db.load.count({ where: { deletedAt: null, status: "carrier_sourcing" } }),
    db.document.count({ where: { status: "pending_review" } }),
    db.company.count({ where: { status: "pending" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome, {user.fullName} ({user.role.replace("_", " ")}).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Tile label="Loads needing a quote" value={needsQuote} href="/ops/loads?status=quote_requested" />
        <Tile label="Quotes awaiting response" value={pendingApproval} href="/ops/loads" />
        <Tile label="Sourcing a carrier" value={sourcingCarrier} href="/ops/dispatch" />
        <Tile label="Documents pending review" value={pendingDocuments} href="/ops/documents" />
        <Tile label="Companies pending approval" value={pendingCompanies} href="/ops/shippers" />
      </div>
    </div>
  );
}
