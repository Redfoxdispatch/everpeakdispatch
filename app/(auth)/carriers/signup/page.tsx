import { db } from "@/lib/db/client";
import { AuthSplitLayout } from "@/components/shared/auth-split-layout";
import { MARKETING_IMAGES } from "@/lib/marketing/images";
import { CarrierSignupForm } from "./signup-form";

// Reads the live equipment-type list from the database, which must never be
// baked into the static build (build machines have no DB access, and a
// statically-frozen list would go stale the moment ops adds/retires an
// equipment type without a full redeploy).
export const dynamic = "force-dynamic";

export default async function CarrierSignupPage() {
  const equipmentTypes = await db.equipmentType.findMany({
    where: { active: true },
    orderBy: { label: "asc" },
  });

  return (
    <AuthSplitLayout
      image={MARKETING_IMAGES.bridgeAtDusk.src}
      alt={MARKETING_IMAGES.bridgeAtDusk.alt}
      eyebrow="For carriers"
      title="Real freight, real lanes, no games."
      description="Tell us about your fleet. Our team verifies your authority and insurance before granting portal access."
    >
      <h1 className="text-2xl font-semibold text-brand-ink">Haul freight with EverPeakDispatch</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Create your carrier account.</p>
      <div className="mt-8">
        <CarrierSignupForm equipmentTypes={equipmentTypes} />
      </div>
    </AuthSplitLayout>
  );
}
