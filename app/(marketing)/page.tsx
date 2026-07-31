import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroReveal, Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { SplitText } from "@/components/shared/split-text";
import { Magnetic } from "@/components/shared/magnetic";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { ParallaxImage } from "@/components/shared/parallax-image";
import { MARKETING_IMAGES } from "@/lib/marketing/images";

const VALUE_PROPS = [
  {
    title: "Vetted carrier network",
    description:
      "Every carrier we dispatch is checked for active FMCSA authority and current insurance before they touch your freight.",
  },
  {
    title: "One point of contact",
    description:
      "A dedicated broker manages your lane from quote to delivery — no call centers, no hand-offs.",
  },
  {
    title: "Real-time visibility",
    description: "Track pickup, transit, and delivery status without picking up the phone.",
  },
];

const TRUST_SIGNALS = [
  { value: 10000, suffix: "+", label: "loads dispatched" },
  { value: 98, suffix: "%", label: "on-time delivery" },
  { value: 500, suffix: "+", label: "active carriers" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero — full-bleed port photography, navy duotone scrim, fixed nav overlays transparently at top. */}
      <section className="relative flex h-[92vh] min-h-[92vh] items-center overflow-hidden bg-brand-navy-950">
        <ParallaxImage
          src={MARKETING_IMAGES.portAtNight.src}
          alt={MARKETING_IMAGES.portAtNight.alt}
          fill
          strength={40}
          priority
        />
        {/* Duotone scrim — see context/design.md §6. The one sanctioned gradient in the system: over a photo, never decorative-alone. */}
        <div className="absolute inset-0 bg-linear-to-t from-brand-navy-950 via-brand-navy-950/70 to-brand-navy-950/20" />
        <div className="absolute inset-0 bg-linear-to-r from-brand-navy-950/95 via-brand-navy-950/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-32">
          <div className="max-w-2xl">
            <HeroReveal>
              <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-400 uppercase">
                Global freight brokerage
              </span>
            </HeroReveal>
            <h1 className="mt-4 text-[clamp(2.75rem,5.5vw,4.75rem)] leading-[1.05] font-bold text-white">
              <SplitText delay={0.15}>Freight moved right, every time.</SplitText>
            </h1>
            <HeroReveal delay={0.5}>
              <p className="mt-6 max-w-lg text-lg text-white/70">
                A full-service freight brokerage connecting shippers with vetted carriers across
                full truckload, LTL, and specialized equipment — run on precision, not phone
                tag.
              </p>
            </HeroReveal>
            <HeroReveal delay={0.65}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Magnetic>
                  <Button size="lg" render={<Link href="/shippers/signup" />} nativeButton={false}>
                    Ship freight
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    render={<Link href="/carriers/signup" />}
                    nativeButton={false}
                  >
                    Haul freight
                  </Button>
                </Magnetic>
              </div>
            </HeroReveal>
          </div>
        </div>
      </section>

      {/* Trust signals — deliberately asymmetric: the lead stat is larger than its siblings, and every number counts up. */}
      <section className="border-b border-brand-navy-100 bg-white">
        <RevealGroup className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-[1.4fr_1fr_1fr]">
          <RevealItem className="border-b border-brand-navy-100 pb-8 text-center sm:border-b-0 sm:border-r sm:pr-10 sm:pb-0 sm:text-left">
            <AnimatedCounter
              value={TRUST_SIGNALS[0].value}
              suffix={TRUST_SIGNALS[0].suffix}
              className="font-heading text-6xl font-bold text-brand-gold-600"
            />
            <div className="mt-2 text-muted-foreground">{TRUST_SIGNALS[0].label}</div>
          </RevealItem>
          {TRUST_SIGNALS.slice(1).map((signal) => (
            <RevealItem key={signal.label} className="text-center sm:text-left">
              <AnimatedCounter
                value={signal.value}
                suffix={signal.suffix}
                className="font-heading text-4xl font-semibold text-brand-ink"
              />
              <div className="mt-2 text-muted-foreground">{signal.label}</div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Value props — asymmetric split: parallax warehouse photography + a stacked list, not a 3-up card grid. */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-28 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal variant="image">
            <ParallaxImage
              src={MARKETING_IMAGES.warehouseInterior.src}
              alt={MARKETING_IMAGES.warehouseInterior.alt}
              className="aspect-4/5 rounded-lg lg:aspect-auto lg:h-140"
              strength={50}
            />
          </Reveal>
          <div>
            <Reveal>
              <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
                Why shippers work with us
              </span>
            </Reveal>
            <h2 className="mt-3 max-w-md text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              <SplitText>Built for shippers who&apos;ve outgrown the call center.</SplitText>
            </h2>
            <RevealGroup className="mt-10 space-y-8">
              {VALUE_PROPS.map((prop) => (
                <RevealItem key={prop.title} className="border-l-2 border-brand-gold-500 pl-6">
                  <h3 className="text-lg font-semibold text-brand-ink">{prop.title}</h3>
                  <p className="mt-1.5 text-muted-foreground">{prop.description}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Full-bleed network motif break — parallax. */}
      <section className="relative h-[420px] overflow-hidden bg-brand-navy-950">
        <ParallaxImage
          src={MARKETING_IMAGES.highwayInterchange.src}
          alt={MARKETING_IMAGES.highwayInterchange.alt}
          fill
          className="opacity-80"
          strength={70}
        />
        <div className="absolute inset-0 bg-linear-to-r from-brand-navy-950/90 via-brand-navy-950/30 to-brand-navy-950/70" />
        <div className="relative mx-auto flex h-full max-w-6xl items-center px-6">
          <Reveal className="max-w-md">
            <p className="text-2xl leading-snug font-medium text-white">
              &ldquo;Every lane, every load, tracked from pickup to delivery — no black box.&rdquo;
            </p>
            <p className="mt-4 text-sm text-white/60">The BluePeakDispatch operations desk</p>
          </Reveal>
        </div>
      </section>

      {/* Global reach — 60/40 split, parallax bridge photography. */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Reveal>
              <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
                Coast to coast
              </span>
            </Reveal>
            <h2 className="mt-3 max-w-md text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              <SplitText>Coverage across every major freight corridor.</SplitText>
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-md text-muted-foreground">
                From regional lanes to long-haul cross-country freight, our carrier network
                covers the corridors that matter to your business — with a dispatcher who knows
                every one of them by name.
              </p>
              <div className="mt-8">
                <Magnetic>
                  <Button render={<Link href="/services" />} nativeButton={false}>
                    Explore our services
                  </Button>
                </Magnetic>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} variant="image">
            <ParallaxImage
              src={MARKETING_IMAGES.bridgeAtDusk.src}
              alt={MARKETING_IMAGES.bridgeAtDusk.alt}
              className="aspect-4/5 rounded-lg lg:aspect-auto lg:h-140"
              strength={50}
            />
          </Reveal>
        </div>
      </section>

      {/* Final CTA — navy, gold action. */}
      <section className="border-t border-brand-navy-800 bg-brand-navy-950">
        <Reveal className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-white">
            Ready to move freight?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Get a quote in minutes, or join our carrier network to see available loads.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Magnetic>
              <Button render={<Link href="/shippers/signup" />} nativeButton={false}>
                Get a quote
              </Button>
            </Magnetic>
            <Magnetic>
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/carriers/signup" />}
                nativeButton={false}
              >
                Join our carrier network
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
