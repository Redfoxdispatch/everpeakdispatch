import { getCurrentUser } from "@/lib/auth/session";

export default async function OpsDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Operations Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome, {user?.fullName} ({user?.role}). Load management, dispatch, and quoting land here
        in Phase 3.
      </p>
    </div>
  );
}
