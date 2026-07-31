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

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About BluePeakDispatch"
        title="Freight brokerage, built differently."
        description="We took the friction out of moving freight — no black-box pricing, no call-center hand-offs, no chasing trucks."
        image={MARKETING_IMAGES.shipTopDown.src}
        alt={MARKETING_IMAGES.shipTopDown.alt}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="text-3xl leading-snug font-semibold text-brand-ink sm:text-4xl">
            <SplitText>
              BluePeakDispatch matches shippers with a vetted network of carriers and manages
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

      <section className="border-t border-brand-navy-800 bg-brand-navy-950">
        <Reveal className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-white">Licensing</h2>
          <p className="mt-4 text-white/60">
            BluePeakDispatch operates as a licensed property broker under its own FMCSA authority.
            MC/DOT numbers and bond information are available on request.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
