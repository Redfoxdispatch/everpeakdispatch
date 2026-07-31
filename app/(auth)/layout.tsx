import { SmoothScrollProvider } from "@/components/shared/smooth-scroll-provider";
import { GrainOverlay } from "@/components/shared/grain-overlay";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <div className="brand-surface">
        <GrainOverlay />
        {children}
      </div>
    </SmoothScrollProvider>
  );
}
