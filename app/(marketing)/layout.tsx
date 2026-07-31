import { MarketingNav } from "@/components/shared/marketing-nav";
import { MarketingFooter } from "@/components/shared/marketing-footer";
import { SmoothScrollProvider } from "@/components/shared/smooth-scroll-provider";
import { GrainOverlay } from "@/components/shared/grain-overlay";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <div className="brand-surface flex min-h-svh flex-col">
        <GrainOverlay />
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </SmoothScrollProvider>
  );
}
