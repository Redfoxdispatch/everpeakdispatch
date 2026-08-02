import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";

/** Phase 8 scope per context/06-development-roadmap.md — not built yet. */
export default async function OpsAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="mt-6">
        <EmptyState
          icon={BarChart3}
          title="Analytics lands in a later phase"
          description="Margin trends, on-time %, and carrier performance reporting are planned for Phase 8, once real operational data exists to report on."
        />
      </div>
    </div>
  );
}
