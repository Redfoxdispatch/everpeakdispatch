import { getCurrentUser } from "@/lib/auth/session";

export default async function ShipperDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shipper Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome, {user?.fullName}. Shipment creation, quotes, tracking, and invoices land here in
        Phase 4.
      </p>
    </div>
  );
}
