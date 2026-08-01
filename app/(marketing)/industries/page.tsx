import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, Factory, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { InteractiveCard } from "@/components/shared/interactive-card";
import { TestimonialCard } from "@/components/shared/testimonial-card";
import { Magnetic } from "@/components/shared/magnetic";
import { MARKETING_IMAGES } from "@/lib/marketing/images";

const INDUSTRIES = [
  {
    icon: UtensilsCrossed,
    title: "Food & Beverage",
    description: "Temperature-controlled and dry freight moved on tight delivery windows.",
  },
  {
    icon: ShoppingBag,
    title: "Retail & Consumer Goods",
    description: "Reliable capacity for replenishment and seasonal volume swings.",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    description: "Inbound raw materials and outbound finished goods, scheduled around production.",
  },
  {
    icon: HardHat,
    title: "Industrial & Building Materials",
    description: "Flatbed and heavy-haul capacity for construction and industrial supply chains.",
  },
];

// Placeholder testimonials, same convention as the homepage's — see
// lib/marketing/images.ts for the equivalent photography note.
const INDUSTRY_TESTIMONIALS = [
  {
    quote:
      "Cold-chain freight doesn't forgive a late truck. We've never had a temperature excursion on a load they've dispatched.",
    role: "Supply Chain Manager, Food & Beverage",
    monogram: "F&B",
  },
  {
    quote: "Production doesn't stop for a missed inbound delivery. Our dispatcher plans around our schedule, not the other way around.",
    role: "Plant Logistics Lead, Manufacturing",
    monogram: "MFG",
  },
];

export default function IndustriesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Who we serve"
        title="Industries we serve, each with different rules."
        description="We work across a range of verticals, each with its own service and compliance requirements."
        image={MARKETING_IMAGES.highwaySunsetTrucks.src}
        alt={MARKETING_IMAGES.highwaySunsetTrucks.alt}
      />

      <section className="bg-white">
        <RevealGroup className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-28 sm:grid-cols-2">
          {INDUSTRIES.map((industry, i) => (
            <RevealItem key={industry.title}>
              <InteractiveCard
                icon={<industry.icon className="size-6 text-brand-gold-600" strokeWidth={1.5} />}
                index={i}
                title={industry.title}
                description={industry.description}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Industry-specific social proof. */}
      <section className="border-t border-brand-navy-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-28">
          <Reveal>
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
              From the network
            </span>
            <h2 className="mt-3 max-w-lg text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              Verticals with zero tolerance for a missed window.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {INDUSTRY_TESTIMONIALS.map((testimonial) => (
              <RevealItem key={testimonial.monogram}>
                <TestimonialCard {...testimonial} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Closing CTA — ties back to Contact for verticals not listed above. */}
      <section className="border-t border-brand-navy-800 bg-brand-navy-950">
        <Reveal className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-white">
            Don&apos;t see your industry?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            We work outside these verticals too — tell us what you move and we&apos;ll tell you what
            we can do.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Magnetic>
              <Button render={<Link href="/contact" />} nativeButton={false}>
                Talk to us
              </Button>
            </Magnetic>
            <Magnetic>
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/shippers/signup" />}
                nativeButton={false}
              >
                Get a quote
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
