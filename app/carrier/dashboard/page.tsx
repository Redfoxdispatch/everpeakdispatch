import { getCurrentUser } from "@/lib/auth/session";

export default async function CarrierDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Carrier Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome, {user?.fullName}. Available loads, fleet, and settlements land here in Phase 5.
      </p>
    </div>
  );
}
