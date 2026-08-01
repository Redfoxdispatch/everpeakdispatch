import { Fragment } from "react";
import { ShieldCheck, FileCheck, TrendingUp, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { SplitText } from "@/components/shared/split-text";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { MARKETING_IMAGES } from "@/lib/marketing/images";

const PRINCIPLES = [
  {
    title: "No black-box pricing",
    description: "Every rate is explained, every accessorial itemized. You see what you pay for.",
  },
  {
    title: "One relationship, not a queue",
    description: "Your broker knows your lanes, your product, and your history — not a rotating call center.",
  },
  {
    title: "Compliance first",
    description: "Every carrier is checked for active authority and insurance before a load is offered.",
  },
];

const STATS = [
  { value: 10000, suffix: "+", label: "loads dispatched" },
  { value: 98, suffix: "%", label: "on-time delivery" },
  { value: 500, suffix: "+", label: "active carriers" },
];

const VETTING_STEPS = [
  {
    icon: ShieldCheck,
    title: "Authority check",
    description: "Active FMCSA operating authority verified before a carrier ever enters the network.",
  },
  {
    icon: FileCheck,
    title: "Insurance verification",
    description: "Current cargo and liability certificates on file before any load is offered.",
  },
  {
    icon: TrendingUp,
    title: "Performance monitoring",
    description: "On-time percentage and claims history tracked on every load, every carrier.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About EverPeakDispatch"
        title="Freight brokerage, built differently."
        description="We took the friction out of moving freight — no black-box pricing, no call-center hand-offs, no chasing trucks."
        image={MARKETING_IMAGES.highwayTrucksAerial.src}
        alt={MARKETING_IMAGES.highwayTrucksAerial.alt}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="text-3xl leading-snug font-semibold text-brand-ink sm:text-4xl">
            <SplitText>
              EverPeakDispatch matches shippers with a vetted network of carriers and manages
              every load from quote to delivery.
            </SplitText>
          </h2>
        </div>
      </section>

      <section className="border-y border-brand-navy-100 bg-white">
        <RevealGroup className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-3">
          {STATS.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                className="font-heading text-4xl font-bold text-brand-gold-600"
              />
              <div className="mt-2 text-muted-foreground">{stat.label}</div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
              How we operate
            </span>
            <h2 className="mt-3 max-w-lg text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              Three principles that don&apos;t change.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <RevealItem key={p.title}>
                <div className="font-heading text-sm text-brand-gold-600">
                  0{i + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-brand-ink">{p.title}</h3>
                <p className="mt-2 text-muted-foreground">{p.description}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* How we vet carriers — horizontal process, tinted section per
          context/design.md §3.1 to visually break from the white sections
          above/below without introducing a new color. */}
      <section className="bg-brand-navy-100/50">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
              Before a load is offered
            </span>
            <h2 className="mt-3 max-w-lg text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              How we vet every carrier.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-4">
            {VETTING_STEPS.map((step, i) => (
              <Fragment key={step.title}>
                <RevealItem className="flex flex-1 items-start gap-4 sm:flex-col sm:gap-0">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-gold-500 bg-white">
                    <step.icon className="size-5 text-brand-gold-600" strokeWidth={1.5} />
                  </div>
                  <div className="sm:mt-5">
                    <h3 className="text-lg font-semibold text-brand-ink">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.description}</p>
                  </div>
                </RevealItem>
                {i < VETTING_STEPS.length - 1 ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="hidden size-5 shrink-0 self-center text-brand-navy-500 sm:mt-6 sm:block"
                    strokeWidth={1.5}
                  />
                ) : null}
              </Fragment>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="border-t border-brand-navy-800 bg-brand-navy-950">
        <Reveal className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-white">Licensing</h2>
          <p className="mt-4 text-white/60">
            EverPeakDispatch operates as a licensed property broker under its own FMCSA authority.
            MC/DOT numbers and bond information are available on request.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
