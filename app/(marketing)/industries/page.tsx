import { UtensilsCrossed, ShoppingBag, Factory, HardHat } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { RevealGroup, RevealItem } from "@/components/shared/motion";
import { InteractiveCard } from "@/components/shared/interactive-card";
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

export default function IndustriesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Who we serve"
        title="Industries we serve, each with different rules."
        description="We work across a range of verticals, each with its own service and compliance requirements."
        image={MARKETING_IMAGES.tankerTopDown.src}
        alt={MARKETING_IMAGES.tankerTopDown.alt}
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
    </div>
  );
}
