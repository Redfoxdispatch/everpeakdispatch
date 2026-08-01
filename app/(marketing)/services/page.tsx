import Link from "next/link";
import { Truck, Package, Zap, Snowflake, Layers, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/motion";
import { InteractiveCard } from "@/components/shared/interactive-card";
import { Magnetic } from "@/components/shared/magnetic";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { MARKETING_IMAGES } from "@/lib/marketing/images";

const SERVICES = [
  {
    icon: Truck,
    title: "Full Truckload (FTL)",
    description:
      "Dry van, refrigerated, flatbed, and specialized equipment for dedicated single-shipper loads coast to coast.",
  },
  {
    icon: Package,
    title: "Less Than Truckload (LTL)",
    description: "Cost-effective shared-trailer capacity for smaller shipments that don't need a full truck.",
  },
  {
    icon: Zap,
    title: "Expedited",
    description: "Time-critical freight with guaranteed pickup windows and priority dispatch.",
  },
  {
    icon: Snowflake,
    title: "Refrigerated (Reefer)",
    description: "Temperature-controlled capacity for perishable and cold-chain freight.",
  },
  {
    icon: Layers,
    title: "Flatbed & Specialized",
    description: "Flatbed, step deck, and power-only for oversized or non-containerized freight.",
  },
  {
    icon: MapPinned,
    title: "Multi-stop & Partial",
    description: "Multiple pickups or drop-offs on a single load, coordinated end to end.",
  },
];

const SERVICES_FAQ = [
  {
    question: "How fast can I get a rate?",
    answer:
      "Same-day for standard truckload and LTL lanes. Specialized or multi-stop moves may take a bit longer while we confirm equipment availability.",
  },
  {
    question: "Do you handle both FTL and LTL?",
    answer:
      "Yes — full truckload and less-than-truckload, plus expedited, reefer, flatbed, and multi-stop moves, all through one broker relationship.",
  },
  {
    question: "How are carriers vetted before dispatch?",
    answer:
      "Every carrier's operating authority and insurance are verified before they're offered a load, and their on-time performance is tracked afterward. See our vetting process on the About page.",
  },
  {
    question: "What if my freight needs special equipment?",
    answer:
      "We carry capacity for flatbed, step deck, power-only, and temperature-controlled freight — tell us the requirement when you request a quote.",
  },
  {
    question: "Is there a minimum volume to work with you?",
    answer: "No minimum. We quote single loads the same way we quote ongoing lane commitments.",
  },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHero
        eyebrow="What we move"
        title="Whatever your freight needs, we have capacity to match."
        image={MARKETING_IMAGES.flatbedMountainRoad.src}
        alt={MARKETING_IMAGES.flatbedMountainRoad.alt}
      />

      <section className="bg-white">
        <RevealGroup className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-28 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <RevealItem key={service.title}>
              <InteractiveCard
                icon={<service.icon className="size-6 text-brand-gold-600" strokeWidth={1.5} />}
                index={i}
                title={service.title}
                description={service.description}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* FAQ — service-specific questions. */}
      <section className="border-t border-brand-navy-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-28">
          <Reveal className="text-center">
            <span className="text-xs font-medium tracking-[0.15em] text-brand-gold-600 uppercase">
              Questions
            </span>
            <h2 className="mt-3 text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-brand-ink">
              Frequently asked.
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="mt-12">
            <FaqAccordion items={SERVICES_FAQ} />
          </Reveal>
        </div>
      </section>

      {/* Closing CTA — navy, gold action, matches the homepage's final CTA. */}
      <section className="border-t border-brand-navy-800 bg-brand-navy-950">
        <Reveal className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-[clamp(2.25rem,3vw,3rem)] leading-[1.15] font-semibold text-white">
            Ready to get a quote?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Tell us your lane and equipment needs — we&apos;ll have a rate back the same day.
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
