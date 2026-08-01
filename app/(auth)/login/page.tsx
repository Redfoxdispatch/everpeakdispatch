import Link from "next/link";
import { AuthSplitLayout } from "@/components/shared/auth-split-layout";
import { MARKETING_IMAGES } from "@/lib/marketing/images";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthSplitLayout
      image={MARKETING_IMAGES.truckHighwayNight.src}
      alt={MARKETING_IMAGES.truckHighwayNight.alt}
      eyebrow="Welcome back"
      title="Operations, shipper, and carrier portals — one sign-in."
    >
      <h1 className="text-2xl font-semibold text-brand-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Enter your credentials to continue.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        New to EverPeakDispatch?{" "}
        <Link href="/shippers/signup" className="font-medium text-brand-gold-600 hover:underline">
          Sign up as a shipper
        </Link>{" "}
        or{" "}
        <Link href="/carriers/signup" className="font-medium text-brand-gold-600 hover:underline">
          as a carrier
        </Link>
        .
      </p>
    </AuthSplitLayout>
  );
}
