import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome, {user?.fullName}. User management, roles, settings, and audit logs land here
        alongside the rest of Phase 3-9.
      </p>
    </div>
  );
}
