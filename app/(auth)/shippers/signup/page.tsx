import { AuthSplitLayout } from "@/components/shared/auth-split-layout";
import { MARKETING_IMAGES } from "@/lib/marketing/images";
import { ShipperSignupForm } from "./signup-form";

export default function ShipperSignupPage() {
  return (
    <AuthSplitLayout
      image={MARKETING_IMAGES.warehouseInterior.src}
      alt={MARKETING_IMAGES.warehouseInterior.alt}
      eyebrow="For shippers"
      title="Get a dedicated broker, not a call queue."
      description="Tell us about your company. Our team reviews every new account before granting portal access."
    >
      <h1 className="text-2xl font-semibold text-brand-ink">Ship freight with BluePeakDispatch</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Create your shipper account.</p>
      <div className="mt-8">
        <ShipperSignupForm />
      </div>
    </AuthSplitLayout>
  );
}
